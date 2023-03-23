# Run a local webserver to test the site.
serve:
    zola serve

# One-time operation to activate versioned githooks.
activate-githooks:
    git config core.hooksPath githooks

test-examples:
    cargo test
