mod input;
mod site;
mod util;

use site::{ Feed, Listing, Site };

pub const WEBSITE: &str = "https://llywelwyn.github.io/";
pub const BLOG_TITLE: &str = "Llyw";
pub const FEED_LINK_COUNT: usize = 30;
const OUTPUT_PATH: &str = "public/";

fn main() {
    let site = get_site();
    clear_output_dir();
    copy_static_content();
    build_pages(site);
}

fn get_site() -> Site {
    let site_text = util::read_path("site/").expect("Failed to read site data");
    return idm::from_str(&site_text).expect("Failed to parse site data");
}

fn clear_output_dir() {
    let _ = std::fs::remove_dir_all(OUTPUT_PATH);
}

fn copy_static_content() {
    dircpy::copy_dir("static", "public").unwrap();
}

fn build_pages(site: Site) {
    // Root listing.
    let listing = Listing::new(BLOG_TITLE, "", site.posts.iter());
    util::write(&listing, format!("{OUTPUT_PATH}index.html")).unwrap();
    // Main feed.
    let feed = Feed::new(BLOG_TITLE, "", &site.posts);
    util::write(&feed, format!("{OUTPUT_PATH}/feed.xml")).unwrap();
    // Posts.
    for post in &site.posts {
        util::write(post, format!("{OUTPUT_PATH}{}/index.html", post.slug)).unwrap();
    }
    // Tag listings and feeds.
    util::write(&site.tags, format!("{OUTPUT_PATH}/tags/index.html")).unwrap();
    for tag in site.post_tags() {
        let listing = Listing::new(
            format!("{BLOG_TITLE}: {tag}"),
            &tag,
            site.posts.iter().filter(|p| p.matches_tag(&tag))
        );
        util::write(&listing, format!("{OUTPUT_PATH}tags/{tag}/index.html")).unwrap();
        let feed = Feed::new(
            format!("{BLOG_TITLE}: {tag}"),
            &format!("tags/{tag}/"),
            site.posts.iter().filter(|p| p.matches_tag(&tag))
        );
        util::write(&feed, format!("{OUTPUT_PATH}tags/{tag}/feed.xml")).unwrap();
    }
    // Links page.
    util::write(&site.links, format!("{OUTPUT_PATH}/links/index.html")).unwrap();
    let feed = Feed::new(format!("{BLOG_TITLE}: links"), "links/", &site.links.links);
    util::write(&feed, format!("{OUTPUT_PATH}links/feed.xml")).unwrap();
}
