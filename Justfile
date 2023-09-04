set shell := ["powershell.exe", "-c"]

# Run a local webserver to test the site.
serve:
    @cargo run
    @cargo install basic-http-server
    @echo Running test server at http://localhost:4000/
    # Run entr to regenerate the site whenever a post changes.
    # Set Ctrl-C to stop both the background server and the updater daemon.
    @Start-Process -NoNewWindow "~/.cargo/bin/basic-http-server.exe" "public/"

stop:
    @Stop-Process -Name 'basic-http-server' -Force

regenerate:
    @just stop
    @just serve

# One-time operation to activate versioned githooks.
register-githooks:
    git config --local core.hooksPath githooks/

# Run the github workflow locally using Docker and act.
local-workflow:
    act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:rust-latest

# Check link health for the website deployed to GH pages.
check-links:
    linkchecker --check-extern https://llywelwyn.github.io/links/

# Test any Rust code examples embedded in blog posts.
#
# See src/lib.rs for registry of posts to embed for testing.
test-examples:
    cargo test
