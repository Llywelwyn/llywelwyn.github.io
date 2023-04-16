# Run a local webserver to test the site.
serve:
    # Generate the link collections into Zola's public dir.
    # Links page isn't handled by Zola generation.
    mkdir -p public/links/
    if [[ ! -e linkstamp ]]; then git clone --depth=1 https://github.com/rsaarelm/linkstamp; fi
    cd linkstamp; git pull
    cd linkstamp; cargo run < ../links.idm > ../public/links/index.html
    cd linkstamp; cargo run -- --feed < ../links.idm > ../public/links/feed.xml

    # Run Zola, links page should work.
    zola serve

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
