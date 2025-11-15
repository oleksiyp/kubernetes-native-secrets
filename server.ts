import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import * as k8s from '@kubernetes/client-node';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const SECRETS_NAMESPACE = process.env.SECRETS_NAMESPACE || 'native-secrets';

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
    },
  });

  // Set up Kubernetes watch for ConfigMaps
  const kc = new k8s.KubeConfig();
  if (process.env.KUBERNETES_SERVICE_HOST) {
    kc.loadFromCluster();
  } else {
    kc.loadFromDefault();
  }

  const watch = new k8s.Watch(kc);

  // Watch for ConfigMap changes in the secrets namespace
  const watchConfigMaps = async () => {
    try {
      await watch.watch(
        `/api/v1/namespaces/${SECRETS_NAMESPACE}/configmaps`,
        {},
        (type, apiObj) => {
          const configMap = apiObj as k8s.V1ConfigMap;
          const namespace = configMap.metadata?.name;

          if (namespace && configMap.data?.metadata) {
            // Broadcast metadata changes to all connected clients
            io.emit('metadata-update', {
              namespace,
              metadata: JSON.parse(configMap.data.metadata),
            });
          }
        },
        (err) => {
          if (err) {
            console.error('Watch error:', err);
            // Restart watch after delay
            setTimeout(watchConfigMaps, 5000);
          }
        }
      );
    } catch (error) {
      console.error('Error starting watch:', error);
      setTimeout(watchConfigMaps, 5000);
    }
  };

  // Start watching if in Kubernetes environment
  if (process.env.KUBERNETES_SERVICE_HOST) {
    watchConfigMaps();
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe', (namespace: string) => {
      socket.join(`namespace:${namespace}`);
      console.log(`Client ${socket.id} subscribed to namespace:${namespace}`);
    });

    socket.on('unsubscribe', (namespace: string) => {
      socket.leave(`namespace:${namespace}`);
      console.log(`Client ${socket.id} unsubscribed from namespace:${namespace}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
