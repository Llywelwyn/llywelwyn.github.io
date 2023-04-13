# Run a local webserver to test the site.
serve:
    zola serve

# One-time operation to activate versioned githooks.
register-githooks:
    git config --local core.hooksPath githooks/

local-workflow:
    act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:rust-latest

build-local:
    zola build
    mkdir -p public/links/
    if [[ ! -e linkstamp ]]; then git clone --depth=1 https://github.com/rsaarelm/linkstamp; fi
    cd linkstamp; git pull
    cd linkstamp; cargo run < ../content/links.idm > ../public/links/index.html
    cd linkstamp; cargo run -- --feed < ../content/links.idm > ../public/links/feed.xml

test-examples:
    cargo test
