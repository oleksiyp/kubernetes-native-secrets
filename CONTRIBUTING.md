# Contributing to Kubernetes Native Secrets

Thank you for your interest in contributing to Kubernetes Native Secrets! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [GitHub Issues](https://github.com/oleksiyp/kubernetes-native-secrets/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Kubernetes version, browser, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues and discussions
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes:
   - Write clear, commented code
   - Follow existing code style
   - Add/update tests if applicable
   - Update documentation as needed

4. Test your changes:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

5. Commit with a clear message:
   ```bash
   git commit -m "Add feature: your feature description"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a Pull Request:
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure CI checks pass

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/kubernetes-native-secrets.git
   cd kubernetes-native-secrets
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose

## Testing

- Test manually in a local Kubernetes cluster
- Verify real-time updates work correctly
- Test with multiple users if possible
- Check edge cases and error handling

## Documentation

- Update README.md for user-facing changes
- Update code comments for implementation changes
- Add JSDoc comments for new functions/components
- Update Helm chart documentation for configuration changes

## Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be included in the next release

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion in GitHub Discussions
- Reach out to maintainers

Thank you for contributing! 🎉
