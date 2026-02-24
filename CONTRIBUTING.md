# Contributing to OrcaHub

Thank you for your interest in contributing to OrcaHub! This guide will help you get started with developing, testing, and submitting contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Standards](#code-standards)
- [Submitting Changes](#submitting-changes)
- [Areas for Contribution](#areas-for-contribution)

## Code of Conduct

Please be respectful and constructive in all interactions. We're building a welcoming community for everyone interested in Docker and Kubernetes management.

## Getting Started

### Prerequisites

- **Go**: 1.25.7 or later
- **Git**: For version control
- **Docker**: For local testing (optional but recommended)

### First-Time Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/orcahub.git
   cd orcahub
   ```

2. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/rivernova/orcahub.git
   ```

3. **Install dependencies**:
   ```bash
   go mod download
   go mod tidy
   ```

## Development Setup

### Building from Source

```bash
# Build the backend server
go build -o orcahub ./cmd/server

# Run the server
./orcahub
```

### Running Tests

```bash
# Run all tests
go test ./...

# Run with verbose output
go test -v ./...

# Run with coverage
go test -cover ./...

# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Hot Reload (Optional)

We recommend using [Air](https://github.com/cosmtrek/air) for hot reloading during development:

```bash
# Install air
go install github.com/cosmtrek/air@latest

# Run with auto-reload
air
```

Create a `.air.toml` in the root directory to configure.

## Project Architecture

OrcaHub follows a **layered architecture pattern** organized by feature domain:

```
internal/docker/
├── containers/
│   ├── adapter/         # Docker API integration
│   ├── domain/          # Business logic & interfaces
│   ├── api/             # HTTP handlers & routing
│   │   ├── handler.go   # Request/response handling
│   │   ├── mappers/     # DTO conversions
│   │   ├── requests/    # Input validation
│   │   ├── responses/   # Output structures
│   │   └── router/      # Route definitions
│   └── model/           # Data structures
├── images/
├── networks/
├── volumes/
└── router/              # Main router aggregation
```

### Layer Responsibilities

- **Model Layer**: Data structures representing domain objects
- **Domain Layer**: Business logic interface definitions and implementations
- **Adapter Layer**: External integrations (Docker API, etc.)
- **API Layer**: HTTP handlers, request validation, response formatting

### Key Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Dependencies are injected; interfaces enable mocking
3. **Consistency**: Follow the same pattern across all feature domains

## Development Workflow

### Creating a Feature Branch

```bash
# Ensure you're up to date with main
git fetch upstream
git checkout main
git merge upstream/main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Message Guidelines

Write clear, descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

**Type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
**Subject**: Imperative, present tense, ~50 characters
**Body**: Explain what and why, not how. Wrap at 72 characters.

**Example**:
```
feat: add container resource limits API endpoint

Add support for querying and updating container resource
limits (CPU, memory). Includes validation and error handling.

Closes #123
```

## Testing

### Test File Structure

Tests should be located alongside the code they test with `_test.go` suffix:

```
service_impl.go
service_impl_test.go
adapter_impl.go
adapter_impl_test.go
```

### Writing Tests

- Use the standard `testing` package
- Use [testify](https://github.com/stretchr/testify) for assertions
- Write table-driven tests for multiple scenarios
- Mock external dependencies

**Example**:
```go
func TestServiceGetContainers(t *testing.T) {
    tests := []struct {
        name    string
        setup   func(*mockAdapter)
        want    []Container
        wantErr bool
    }{
        {
            name: "returns containers",
            setup: func(m *mockAdapter) {
                m.On("ListContainers", mock.Anything).Return([]Container{...}, nil)
            },
            want:    []Container{...},
            wantErr: false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            adapter := new(mockAdapter)
            tt.setup(adapter)
            
            svc := NewService(adapter)
            got, err := svc.GetContainers(context.Background())
            
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
                assert.Equal(t, tt.want, got)
            }
        })
    }
}
```

### Test Coverage Requirements

Aim for at least **80% test coverage** in new code. Check coverage with:

```bash
go test -cover ./...
```

## Code Standards

### Go Code Style

- Follow [Effective Go](https://golang.org/doc/effective_go)
- Use `gofmt` for formatting (built into most editors)
- Use `golint` or `golangci-lint` for linting:

```bash
# Install golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Run linter
golangci-lint run ./...
```

### Naming Conventions

- **Files**: `snake_case.go`
- **Functions/Methods**: `CamelCase`
- **Constants**: `SCREAMING_SNAKE_CASE` or `CamelCase`
- **Interfaces**: Suffix with `er` (e.g., `Reader`, `Writer`, `Service`)
- **Unexported functions**: `camelCase` (lowercase first letter)

### Documentation

- Document all exported functions and types
- Comments for unexported functions explaining intent
- Keep comments current with code changes

**Example**:
```go
// Service defines operations for managing containers.
type Service interface {
    // GetContainers returns all containers.
    GetContainers(ctx context.Context) ([]Container, error)
}
```

### Error Handling

- Return errors explicitly
- Use `fmt.Errorf` with context
- Create custom error types for domain-specific errors when appropriate

```go
if err := svc.StopContainer(ctx, id); err != nil {
    return fmt.Errorf("failed to stop container %s: %w", id, err)
}
```

## Submitting Changes

### Before Submitting

1. **Keep your feature branch up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests and linting**:
   ```bash
   go test ./...
   golangci-lint run ./...
   go fmt ./...
   ```

3. **Write a descriptive commit message** (see guidelines above)

### Creating a Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a PR** on GitHub with:
   - Clear title describing the change
   - Description of what, why, and how
   - Reference any related issues (e.g., "Closes #123")
   - Screenshots or logs if applicable

3. **PR Description Template**:
   ```markdown
   ## Description
   Brief explanation of the change

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   How to test this change

   ## Checklist
   - [ ] Tests pass locally
   - [ ] Code is formatted
   - [ ] Changes are documented
   - [ ] No breaking changes (or documented)
   ```

### PR Review Process

- At least one maintainer review required
- All CI checks must pass
- Address feedback promptly
- Keep PRs focused on a single concern

## Areas for Contribution

### High-Priority Areas

- **Docker Feature Completeness**: Expand container management capabilities
- **Kubernetes Integration**: Initial k8s support implementation
- **Testing**: Increase test coverage, especially for error cases
- **Performance**: Optimize API responses and resource usage
- **Documentation**: API docs, architecture guides, deployment guides

### Beginner-Friendly Issues

Look for issues tagged:
- `good first issue`
- `help wanted`
- `documentation`

These are great entry points for new contributors!

### Documentation

Contributions to documentation are always welcome:
- README improvements
- API endpoint documentation
- Architecture decisions (ADRs)
- Setup guides
- Troubleshooting guides

## Getting Help

- **Discussions**: Open a GitHub Discussion for questions
- **Issues**: Report bugs with clear reproduction steps
- **Slack/Discord**: (When available) Join our community chat

## License

By contributing to OrcaHub, you agree that your contributions will be licensed under the Mozilla Public License 2.0 (the same license as the project).

---

**Thank you for contributing to OrcaHub!** 🐋
