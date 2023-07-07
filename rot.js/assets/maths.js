// Generates an offset of given range+centrepoint.
// generate_offset(3, 5) returns a value within +-3 of 5.
function generate_offset(range, centre) {
    var double_range_plus_one = (range*2) + 1;
    return (Math.floor(Math.random() * double_range_plus_one) - range + centre);
};
function one_of(array) {
    if (!Array.isArray(array)) {
        return array;
    }
    return array[Math.floor(Math.random() * array.length)];
}