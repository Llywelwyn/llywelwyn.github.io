# Run a local webserver to test the site.
serve:
    zola serve

# One-time operation to activate versioned githooks.
register-githooks:
    git config --local core.hooksPath githooks/

local-workflow:
    act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:rust-latest

# Build local static pages.
#
# Run `zola serve` to run a web server of the zola-generated pages, this will
# not include the links page.
build-local:
    zola build
    mkdir -p public/links/
    if [[ ! -e linkstamp ]]; then git clone --depth=1 https://github.com/rsaarelm/linkstamp; fi
    cd linkstamp; git pull
    cd linkstamp; cargo run < ../links.idm > ../public/links/index.html
    cd linkstamp; cargo run -- --feed < ../links.idm > ../public/links/feed.xml

check-links:
    linkchecker --check-extern https://rsaarelm.github.io/links/

test-examples:
    cargo test
