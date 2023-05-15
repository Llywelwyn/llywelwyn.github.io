#set shell := ["sh"]

# Run a local webserver to test the site.
serve:
    @cargo run
    @cargo install basic-http-server
    @echo Running test server at http://localhost:4000/
    # Run entr to regenerate the site whenever a post changes.
    # Set Ctrl-C to stop both the background server and the updater daemon.
    @(trap 'kill 0' SIGINT; ~/.cargo/bin/basic-http-server public/ & (find site/ | entr cargo run) )

build:
    cargo run

# One-time operation to activate versioned githooks.
register-githooks:
    git config --local core.hooksPath githooks/

# Run the github workflow locally using Docker and act.
local-workflow:
    act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:rust-latest

# Check link health for the website deployed to GH pages.
check-links:
    linkchecker --check-extern https://rsaarelm.github.io/links/

# Test any Rust code examples embedded in blog posts.
#
# See src/lib.rs for registry of posts to embed for testing.
test-examples:
    cargo test
