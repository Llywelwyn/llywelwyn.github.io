# Run a local webserver to test the site.
serve:
    zola serve

# One-time operation to activate versioned githooks.
register-githooks:
    git config --local core.hooksPath githooks/

test-examples:
    cargo test
