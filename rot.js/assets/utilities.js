Game.extend = function(src, dest) {
    // Create copy of the source
    var result = {};
    for (var key in src) {
        result[key] = src[key];
    }
    // Copy over all keys from dest
    for (var key in dest) {
        result[key] = dest[key];
    }
    return result;
};

Game.Geometry = {
    line: function(start_x, start_y, end_x, end_y) {
        var points = [];
        var d_x = Math.abs(end_x - start_x);
        var d_y = Math.abs(end_y - start_y);
        var s_x = (start_x < end_x) ? 1 : -1;
        var s_y = (start_y < end_y) ? 1 : -1;
        var err = d_x - d_y;
        var e2;

        while (true) {
            points.push({x: start_x, y: start_y});
            if (start_x == end_x && start_y == end_y) {
                break;
            }
            e2 = err * 2;
            if (e2 > -d_x) {
                err -=d_y;
                start_x += s_x;
            }
            if (e2 < d_x) {
                err += d_x;
                start_y += s_y;
            }
        }
        return points;
    }
};