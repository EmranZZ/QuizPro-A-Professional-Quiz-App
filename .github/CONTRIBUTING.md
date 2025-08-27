# Contributing to QuizPro

Thank you for your interest in contributing to QuizPro! This document provides guidelines for contributing to this professional quiz application.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Search existing issues to avoid duplicates
2. Use the appropriate issue template
3. Provide detailed information about the problem

#### Bug Reports
- **Title**: Clear, descriptive title
- **Description**: Steps to reproduce, expected vs actual behavior
- **Environment**: Browser, version, operating system
- **Screenshots**: If applicable
- **Console Errors**: Any JavaScript errors

#### Feature Requests
- **Title**: Clear feature description
- **Use Case**: Why this feature would be valuable
- **Implementation**: Suggested approach (if any)
- **Alternatives**: Other solutions considered

### Development Setup

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch from `main`
4. **Make** your changes
5. **Test** your changes thoroughly
6. **Submit** a pull request

```bash
git clone https://github.com/yourusername/quizpro.git
cd quizpro
git checkout -b feature/your-feature-name
```

### Code Standards

#### JavaScript
- Use ES6+ features and modern JavaScript
- Follow ESLint configuration (`.eslintrc.json`)
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Handle errors gracefully
- Use async/await for asynchronous operations

```javascript
/**
 * Fetches quiz questions from the API
 * @param {number} numQuestions - Number of questions to fetch
 * @param {string} category - Quiz category ID
 * @param {string} difficulty - Question difficulty level
 * @returns {Promise<Array>} Array of question objects
 */
async function fetchQuestions(numQuestions, category, difficulty) {
  // Implementation
}
```

#### CSS
- Use CSS custom properties for theming
- Follow mobile-first responsive design
- Use semantic class names
- Maintain consistent spacing using design tokens
- Support accessibility (high contrast, reduced motion)

```css
/* Good */
.quiz-question {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

/* Avoid */
.q1 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #ffffff;
}
```

#### HTML
- Use semantic HTML5 elements
- Include proper ARIA attributes
- Ensure keyboard navigation support
- Provide meaningful alt text for images
- Use proper heading hierarchy

```html
<!-- Good -->
<section class="quiz-section" role="main" aria-live="polite">
  <h2 class="question-heading">Question 1 of 10</h2>
  <div class="answer-list" role="radiogroup" aria-labelledby="question-text">
    <!-- answers -->
  </div>
</section>
```

### Testing Guidelines

#### Manual Testing
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test responsive design on various screen sizes
- Test keyboard navigation thoroughly
- Verify accessibility with screen readers
- Test offline functionality
- Test error scenarios

#### Accessibility Testing
- Use keyboard-only navigation
- Test with screen reader (NVDA, VoiceOver, JAWS)
- Verify color contrast ratios
- Check focus indicators
- Test with high contrast mode

### Pull Request Process

1. **Update** documentation if needed
2. **Add** tests for new features
3. **Ensure** code passes linting
4. **Update** CHANGELOG.md with your changes
5. **Request** review from maintainers

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Accessibility testing completed
- [ ] Cross-browser testing completed

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

## 🎯 Development Focus Areas

### High Priority
- Accessibility improvements
- Performance optimizations
- Mobile experience enhancements
- Error handling improvements
- Security enhancements

### Medium Priority
- New quiz features
- UI/UX improvements
- Code refactoring
- Documentation updates

### Low Priority
- Advanced features
- Experimental functionality
- Nice-to-have improvements

## 📝 Documentation

### Code Documentation
- JSDoc for all public functions and classes
- Inline comments for complex logic
- README updates for new features
- API documentation for public interfaces

### User Documentation
- Update README.md for new features
- Add examples and use cases
- Update troubleshooting section
- Include accessibility notes

## 🔧 Technical Guidelines

### Performance
- Minimize DOM manipulations
- Use efficient CSS selectors
- Optimize images and assets
- Implement lazy loading where appropriate
- Monitor bundle size

### Security
- Sanitize all user inputs
- Use HTTPS for external requests
- Implement proper error handling
- Follow OWASP guidelines
- Regular security audits

### Browser Support
- Support modern browsers (last 2 versions)
- Graceful degradation for older browsers
- Progressive enhancement approach
- Mobile browser compatibility

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given appropriate credit in documentation

## 📞 Getting Help

- **Questions**: Create a GitHub issue with "question" label
- **Discussions**: Use GitHub Discussions
- **Real-time**: Join community chat (if available)
- **Documentation**: Check README.md and wiki

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Every contribution, no matter how small, helps make QuizPro better for everyone. Thank you for taking the time to contribute!

---

**Happy Coding!** 🚀
