$(document).ready(function() {
    // insert a button for show / hide
    // set a cookie on hide / show
    // on page ready hide the builds if that's what we had last
    // auto refresh every 5 seconds -- just grab the page again and then throw it in the container
    // make an on / off button for auto refresh

    // count the number of "not ok" instances
    // start counting the current number of passed / failed builds
    // start counting the maximum number of passed / failed builds

    // display how many more builds need to fail / pass in a row to reach a new maximum
    var sidebar = $(".past-builds");
    if (!sidebar) { return; } // bail if we're not on a page we expect

    var command_center = $("<div></div>");
    command_center.css("text-align", "center");

    var visible = true;
    var show_hide_toggle = $("<button value='Show / Hide builds'>Show / Hide builds</button>");
    show_hide_toggle.click(function(e) {
        visible = !visible;
        sidebar.children("ul").toggle(visible);
    });

    var refresh_toggle = $("<label>Autorefresh<input id=refresh_toggle type=checkbox checked=checked></label>");

    command_center.append(show_hide_toggle);
    command_center.append(refresh_toggle);
    show_hide_toggle.click();

    var current_branch = function() {
        var path = window.location.pathname.split('/');
        var part;
        while ((part = path.shift()) != undefined) {
            if (part.match(/projects/)) {
                return path.shift();
            }
        }
        return undefined;
    };

    var switch_to_branch = function(name) {
        var branch = "storenet" + (name == "master" ? "" : "-" + name);
        var this_branch = current_branch();
        if (this_branch == branch || this_branch == 'storenet' && branch == 'master') { return; }

        window.location = 'https://goldberg.corp.nearbuysystems.com/projects/' + branch;
    };

    var keyboard = window.Keyboard.Keyboard();
    keyboard.bind(document);
    keyboard.define({
        'Control+R': function(e) {
            refresh_toggle.click();
        },
        'Control+B': function(e) {
            show_hide_toggle.click();
        },
        'Control+M': function(e) { switch_to_branch('master'); },
        'Control+S': function(e) { switch_to_branch('staging'); },
        'Control+D': function(e) { switch_to_branch('deploy'); },
        'Control+I': function(e) { window.location = 'https://goldberg.corp.nearbuysystems.com'; },
        'Alt+Right': function(e) {
            console.log("to the future!");
            var current_build = $("li.selected");
            if (current_build[0] == $("div.past-builds ul li:first-child")[0]) {
                return console.log("already at the present. Refusing to visit the future like a coward!");
            }

            var current_build_number = current_build.children("a").html().replace(' building', '');
            var next_build = parseInt(current_build_number) + 1;
            window.location = 'https://goldberg.corp.nearbuysystems.com/projects/' + current_branch() + '/builds/' + next_build;
        },
        'Alt+Left': function(e) {
            console.log("back to the past!");

            var current_build = $("li.selected");
            var total_builds = $("div.past-builds ul li").length;
            if (current_build[0] == $("div.past-builds ul li:first-child")[total_builds - 1]) {
                console.log("Refusing to travel past the beginning of the universe like a coward!");
            }
            else {
                var current_build_number = current_build.children("a").html().replace(' building', '');
                var next_build = parseInt(current_build_number) - 1;
                window.location = 'https://goldberg.corp.nearbuysystems.com/projects/' + current_branch() + '/builds/' + next_build;
          }
        }
    });

    var builds = sidebar.html();
    sidebar.html(command_center);
    sidebar.append(builds);

    var url = window.location.pathname;
    var current_build_log = $(".latest-build");

    if (!current_build_log.hasClass("failed") && !current_build_log.hasClass("passed")) {
        var id = window.setInterval(function() {
            $.get(url, function(data) {
                if (!$("#refresh_toggle").attr("checked")) { return; }
                var new_document = $(data);
                var new_logs = new_document.find(".latest-build");
                current_build_log.html(new_logs);
                window.scrollTo(0, document.body.scrollHeight);

                if (new_logs.html().match(/not ok/)) {
                    $("div.footer").css("background", "red");
                    var heading = $("div.project_heading");
                    heading.css("background", "red");
                    heading.html(heading.html().replace('building', 'failing'));
                }

                if ($(".latest-build").hasClass("passed") || $(".latest-build").hasClass("failed")) {
                    window.clearInterval(id);
                    // TODO : setup an interval so we can periodically refresh to see the next build
                }
            });
        }, 1000 );
    }
});
