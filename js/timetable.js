(function($) {
    var TimeTable = function(options, container) {

        var defaultOptions = {
            orientation: "landscape",
            dayView: false,
            dayViewThreshold: 300,
            minHourSize: 50,
            minDaySize: 50,
            startHour: 9,
            endHour: 17,
            nowLineEnable: true,
            startDay: 1,
            endDay: 5,
            activities: [],
            titleSize: 75,
            NoContentMsg: "No Activities to Display",
            loadingMsg: "Loading...",
            loadErrorMsg: "An error occured loading the Timetable",
            activityAttribute: null,
            hoursOptions: {
                events: {}
            },
            daysOptions: {
                events: {},
            },
            ActivityOptions: {
                mouseoverDelay: 500,
                mouseoverMinHeight: 0,
                mouseoverMinWidth: 0,
                mouseoverEasing: "easeOutElastic",
                mouseoverSpeed: "normal",
                zindex: 1000,
                events: {}
            }
        };

        var OptionsDependant = function(container) {
            this.container = $(container);
        };

        var settings = $.extend(true, defaultOptions, options);

        OptionsDependant.prototype = {
            orientation: function() {

                if (this.isDayView()) {
                    return 'portrait';
                } else {
                    return settings.orientation;
                }

            },
            isMobile: function() {
                if (settings['isMobile'] != null && settings['isMobile'] != undefined) {
                    if ($.isFunction(settings.isMobile)) {
                        return settings.isMobile();
                    } else {
                        return settings.isMobile;
                    }
                } else {
                    return /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
                }
            },
            isDayView: function() {
                if (settings.dayView || this.container.width() < settings.dayViewThreshold || (this.isMobile())) {
                    return true;
                } else {
                    return false;
                }
            }
        };



        function createTimeTable() {

            var internal = {
                create: function() {
                    var cssObj = {
                        "position": "relative"
                    };
                    $(tt.container)
                            .addClass("tt-container")
                            .css(cssObj)
                            .attr("role", "grid");;
                    if (tt.isMobile()) {
                        $(tt.container).addClass("tt-mobile");
                    }
                }
            };
            var tt = $.extend(
                    true,
                    new OptionsDependant(container),
                    {
                        hoursContainer: new HoursContainer(),
                        daysContainer: new DaysContainer(),
                        messageOverlay: new MessageOverlay(),
                        nowLine: new NowLine(),
                        name: "timetable",
                        option: function(key, value) {
                            if ($.isPlainObject(key)) {
                                settings = $.extend(true, settings, key);
                                $.each(key, $.proxy(function(key, val) {
                                    var evnt = {
                                        type: key + "Changed",
                                        newValue: val
                                    }
                                    this.container.trigger(evnt);
                                }, this));

                            } else if (key && typeof value === "undefined") {
                                return settings[ key ];
                            } else {
                                settings[ key ] = value;
                                var evnt = {
                                    type: key + "Changed",
                                    newValue: value
                                }
                                this.container.trigger(evnt);
                            }

                            this.container.trigger("tt.update");
                            return this;
                        },
                        render: function(activityList) {

                            if (typeof activityList !== 'undefined') {
                                settings.activities = activityList;
                            }
                            this.daysContainer.renderActivities();
                        },
                        resize: function() {
                            $(this.container).trigger("tt.update");
                        }
                    }
            );

            var events = {
                "tt.changed": $.proxy(function() {
                    $(this.container).trigger("tt.update");
                }, tt),
                "tt.update": $.proxy(function() {
                    this.daysContainer.render();
                    this.hoursContainer.render();
                    this.daysContainer.placeActivities();
                    if (settings.nowLineEnable) {
                        this.nowLine.render();
                    }
                    $(container).trigger("tt.container.updated");
                    event.stopPropagation();
                }, tt),
                "tt-activitiesChanged": $.proxy(function(evnt) {
                    this.render();
                }, tt)
            };

            $(container).on(events);

            
            tt.daysContainer.init();
            tt.hoursContainer.init();
            tt.messageOverlay.init();
            tt.nowLine.init();

            tt.resize();
            internal.create();
            tt.render();

            return tt;
        }
        ;


        var HoursContainer = function() {
            var HC = new OptionsDependant(container);

            var posRef = {
                landscape: {
                    size: "width",
                    nonsize: "height",
                    position: "left",
                    nonposition: "top"
                },
                portrait: {
                    size: "height",
                    nonsize: "width",
                    position: "top",
                    nonposition: "left"
                }
            };

            $.extend(true, HC, {
                hour: 0,
                init: function() {
                    this.hours = this._generateHours();
                    this.render();
                },
                _generateHours: function() {
                    var aHours = new Array();
                    for (var hour = 0; hour < 24; hour++) {
                        var hourStr = (hour < 10) ? "0" + hour + "00" : hour + "00";
                        aHours.push($("<div/>", {"class": "tt-hour", style: "width: 100%;","aria-hidden": "true"}).text(hourStr).on(this.events));
                    }
                    return aHours;
                },
                render: function() {
                    this.container.append(this.hours.slice(settings.startHour, settings.endHour + 1));
                    this.hour = settings.endHour - settings.startHour + 1;
                    this.resize();
                },
                resize: function() {
                    settings.hourSize = (parseInt(this.container[posRef[this.orientation()].size]()) - settings.titleSize) / (this.hour);
                    settings.hourNumber = this.hour;

                    if (settings['minHourSize'] != null && settings.hourSize < settings.minHourSize) {
                        settings.hourSize = settings.minHourSize;

                        var cssObj = {};
                        cssObj[posRef[this.orientation()].size] = (settings.hourSize * this.hour) + settings.titleSize;
                        this.container.css(cssObj);

                    }
                    var size = settings.hourSize;
                    var offset = settings.titleSize;
                    var that = this;
                    $("div.tt-hour", this.container).each(function(index, el) {
                        var cssObj = {
                            position: "absolute",
                            height: "100%"
                        };
                        cssObj[posRef[that.orientation()].size] = size;
                        cssObj[posRef[that.orientation()].nonsize] = "100%";
                        cssObj[posRef[that.orientation()].position] = offset + (size * index);
                        cssObj[posRef[that.orientation()].nonposition] = 0;
                        $(this).css(cssObj);
                    });
                }

            }, settings.hoursOptions);

            return HC;
        };


        var DaysContainer = function() {
            var DC = new OptionsDependant(container);

            var posRef = {
                portrait: {
                    size: "width",
                    nonsize: "height",
                    position: "left",
                    nonposition: "top"
                },
                landscape: {
                    size: "height",
                    nonsize: "width",
                    position: "top",
                    nonposition: "left"
                }

            };
            $.extend(true, DC, {
                dayNames: {
                    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                    fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
                    de: ["Son", "Mon", "Die", "Mit", "Don", "Fr", "Sam"],
                    es: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
                    it: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]
                },
                lang: "en",
                day: 0,
                init: function() {
                    this.days = this._generateDays();
                    var now = new Date();
                    var today = now.getDay();
                    if (today > settings.endDay || today < settings.startDay) {
                        this.viewDay = settings.startDay;
                    } else {
                        this.viewDay = today;
                    }

                    this.render();
                },
                touch: {},
                move: 0,
                nextDay: $('<div class="tt-mobNxtDay"></div>').bind("click touchstart", function(event) {
                    DC.viewDay = Math.min(Math.max(DC.viewDay + 1, settings.startDay), settings.endDay);
                    DC.render();
                    event.preventDefault();
                    return false;
                }),
                previousDay: $('<div class="tt-mobPrevDay"></div>').bind("click touchstart", function(event) {
                    DC.viewDay = Math.min(Math.max(DC.viewDay - 1, settings.startDay), settings.endDay)
                    DC.render();
                    event.preventDefault();
                    return false;
                }),
                _generateDayHeaders: function() {
                    var days = [];
                    $.each(this.dayNames[this.lang], function(index, day) {
                        var $dayNode = $("<div/>", {"class": "tt-dayTitle"}).text(day);
                        days.push($dayNode);
                    });
                    return days;
                },
                _generateDays: function() {

                    var eventHandlers = this.events,
                            days = [],
                            today = (new Date()).getDay(),
                            dayHeaders = this._generateDayHeaders();

                    $.each(dayHeaders, function(index, $day) {
//                        days.push($("<div/>", {"class": "tt-day"}).bind(eventHandlers).append($day));
                        days.push(
                                $("<div/>", {
                                    "class": "tt-day" + (today === index ? " tt-today" : ""),
                                    "role": "row"
                                })
                                .on(eventHandlers)
                                .append($day)
                                );
                    });

                    return days;
                },
                render: function() {
                    if (this.isDayView()) {
                        $('.tt-day', this.container).detach();
                        this.container.append(this.days[this.viewDay].hide().fadeIn("fast"));
                        this.container.prepend(this.nextDay);
                        this.container.prepend(this.previousDay);
                        this.day = 1;
                    } else {
                        this.nextDay.detach();
                        this.previousDay.detach();
                        this.container.append(this.days.slice(settings.startDay, settings.endDay + 1));
                        this.day = settings.endDay - settings.startDay + 1;
                    }
                    this.resize();
                },
                daysActivities: new Array(),
                defaultAjax: {
                    beforeSend: $.proxy(function() {
                        this.container.trigger("tt-activitiesLoading");
                    }, DC),
                    success: $.proxy(function() {
                        this.container.trigger("tt-activitiesLoaded");
                    }, DC)
                },
                ajaxOn: null,
                renderActivities: function() {
                    var toabort = false;
                    if (this.ajaxOn !== null) {
                        toabort = this.ajaxOn;
                    }
                    $('.tt-activity', this.container).fadeOut().remove();

                    $.each(this.daysActivities, function(index, activity) {
                        activity.remove();
                        delete activity;
                    });
                    this.daysActivities = new Array();

                    if ($.isFunction(settings.activities)) {
                        this.__populateActivities(settings.activities());
                    } else if ($.isPlainObject(settings.activities)) {
                        var ajaxSettings = $.extend(settings.activities, this.defaultAjax);
                        this.ajaxOn = $.ajax(ajaxSettings);
                    } else if ($.isArray(settings.activities)) {
                        this.__populateActivities(settings.activities);
                    } else {
                        this.ajaxOn = $.ajax(settings.activities, this.defaultAjax);
                    }

                    if (toabort)
                        toabort.abort();
                    if (this.ajaxOn !== null) {
                        this.ajaxOn.then(function(data) {
                            if (settings['activityAttribute'] !== null && data[settings['activityAttribute']]) {
                                return data[settings['activityAttribute']];
                            } else {
                                return data;
                            }
                        }).done(function(data) {
                            $(container).trigger("tt-renderStart");
                        }).done($.proxy(this.__populateActivities, this)).fail(function() {
                            $(container).trigger("tt-activityLoadFailed");
                        });
                    }
                },
                placeActivities: function() {

                    var PackEvents = $.proxy(function(columns, block_width) {
                        var collisions = columns.length;
                        $.each(columns, function(colIndex, col) {
                            $.each(col, function(i, activity) {
                                var hourIndex = activity.hour - settings.startHour;
                                var hourOffset = (settings.hourSize / 60) * activity.minute;
                                activity.setPosition({
                                    hour: (hourIndex * settings.hourSize) + hourOffset + settings.titleSize, // hourPosition
                                    size: activity.duration * (settings.hourSize / 60), // durationSize
                                    day: ((colIndex / collisions) * 100) + '%', //left                          // 
                                    nonsize: block_width / collisions - 1         //width                       // 
                                });
                                activity.render();
                            });
                        });
//                           
                    }, this);

                    var collidesWith = function(a, b)
                    {
                        var aTop = (a.hour * 60) + a.minute;
                        var bTop = (b.hour * 60) + b.minute;
                        var aBottom = aTop + a.duration;
                        var bBottom = bTop + b.duration;

                        return aBottom > bTop && aTop < bBottom;
                    }

                    var lastEventEnding = null;
                    var lastEventDay = null;
                    var columns = [];
                    var block_width = settings.daySize;
                    $(this.daysActivities).each(function(index, activity) {
//                            var activity = $(a);
                        var thisEventStart = (activity.hour * 60) + activity.minute;
                        var thisEventEnding = thisEventStart + activity.duration;
                        if (
                                lastEventEnding !== null &&
                                (thisEventStart >= lastEventEnding || lastEventDay < activity.dow)
                                ) {
                            PackEvents(columns, block_width);
                            columns = [];
                            lastEventEnding = null;
                        }

                        var placed = false;
                        for (var i = 0; i < columns.length; i++) {
                            var col = columns[ i ];
                            var collides = false;
                            $.each(col, function(index, placedActivity) {
                                if (collidesWith(placedActivity, activity)) {
                                    collides = true;
                                    return false;
                                }
                            });

                            if (!collides) {
                                col.push(activity);
                                placed = true;
                                break;
                            }
                        }
                        if (!placed) {
                            columns.push([activity]);
                        }
                        if (lastEventEnding === null || thisEventEnding > lastEventEnding || activity.dow > lastEventDay) {
                            lastEventEnding = thisEventEnding;
                            lastEventDay = activity.dow;
                        }
                    });
                    if (columns.length > 0) {
                        PackEvents(columns, block_width);
                    }

                },
                __populateActivities: function(activities) {
                    if (activities.length > 0) {
                        $.each(activities, $.proxy(function(index, activityData) {

                            var activity = new Activity(this.days[activityData.scheduledDay], activityData);

                            this.daysActivities.push(activity);
                        }, this));

                        this.daysActivities = this.daysActivities.sort(function(e1, e2) {
                            if (e1.dow < e2.dow)
                                return -1;
                            if (e1.dow > e2.dow)
                                return 1;

                            var e1Top = (e1.hour * 60) + e1.minute;
                            var e2Top = (e2.hour * 60) + e2.minute;
                            var e1Bottom = e1Top + e1.duration;
                            var e2Bottom = e2Top + e2.duration;

                            if (e1Top < e2Top)
                                return -1;
                            if (e1Top > e2Top)
                                return 1;

                            if (e1Bottom < e2Bottom)
                                return -1;
                            if (e1Bottom > e2Bottom)
                                return 1;

                            return 0;
                        });

                        this.placeActivities();

                        $(container).trigger("tt-activitiesRendered");
                    } else {
                        $(container).trigger("tt-noActivities");
                    }
                },
                addActivity: function(activity) {
                    var day = this.days[activity.dow];
                    activity.container = day;
                    activity._attach();
                },
                resize: function() {
                    settings.daySize = (parseInt(this.container[posRef[this.orientation()].size]()) - settings.titleSize) / this.day;

                    if (settings['minDaySize'] != null && settings.daySize < settings.minDaySize) {
                        settings.daySize = settings.minDaySize;

                        var cssObj = {};
                        cssObj[posRef[this.orientation()].size] = (settings.daySize * this.day) + settings.titleSize;
                        this.container.css(cssObj);

                    }

                    var size = settings.daySize;
                    var offset = settings.titleSize;

                    settings.dayNumber = this.day;

                    var that = this;
                    $("div.tt-day", this.container).each(function(index, el) {
                        var cssObj = {
                            position: "absolute"
                        };
                        cssObj[posRef[that.orientation()].size] = size;
                        cssObj[posRef[that.orientation()].nonsize] = "100%";
                        cssObj[posRef[that.orientation()].position] = offset + (size * index);
                        cssObj[posRef[that.orientation()].nonposition] = 0;
                        $(this).css(cssObj);
                    });

                    var titlePos = {
                        position: "absolute",
                        "text-align": "center"
                    };

                    titlePos[posRef[that.orientation()].size] = "100%";
                    titlePos[posRef[that.orientation()].nonsize] = settings.titleSize;
                    var hidden = $("<span/>", {style: "visibility:hidden;width:auto;height:auto;font-size:5px;"});
                    hidden.text(this.dayNames[this.lang][0]);
                    $(this.container).append(hidden);
                    var hiddenSize = {
                        "width": hidden.width(),
                        "height": hidden.height()
                    };
                    while (hiddenSize[posRef[that.orientation()].size] < size / 2 && hiddenSize[posRef[that.orientation()].nonsize] < settings.titleSize / 2) {
                        var fs = parseInt(hidden.css("font-size"), 10);
                        hidden.css({
                            "font-size": (fs + 1) + "px"
                        });
                        hiddenSize.width = hidden.width();
                        hiddenSize.height = hidden.height();
                    }
                    titlePos["font-size"] = hidden.css("font-size");

                    hidden.remove();

                    $('div.tt-dayTitle', this.container).each(function(index, el) {
                        $(this).css(titlePos);
                        $(this).css({
                            "line-height": $(this).height() + "px"
                        });
                    });

                }
            }, settings.daysOptions);

            $(container).on("tt-activitiesChanged", $.proxy(DC.renderActivities, DC));

            return DC;
        };

        var Activity = function(activityContainer, data) {
            var A = new OptionsDependant(activityContainer);

            var posRef = {
                landscape: {
                    hour: "left",
                    day: "top",
                    size: "width",
                    nonsize: "height"
                },
                portrait: {
                    hour: "top",
                    day: "left",
                    size: "height",
                    nonsize: "width"
                }
            };

            $.extend(true, A, {
                color: "#C0A3D1",
                title: "Event Title",
                startTime: "00:00",
                scheduledDay: 0,
                duration: 60,
                activityMargin: 0,
//                activityObj: $("<div/>", {"class": "tt-activity", style: "position: relative; display: none; overflow: hidden;", "tabindex": 0}),
                activityObj: $("<div/>", {
                     "class": "tt-activity",
                     style: "position: relative; display: none; overflow: hidden; z-index: " + settings.ActivityOptions.zindex,
                     "role": "gridcell",
                     "tabindex": 0
                 }),
                _init: function() {
                    var start = this.startTime.split(":");
                    this.dow = parseInt(this.scheduledDay);
                    this.hour = parseInt(start[0], 10);
                    this.minute = parseInt(start[1], 10);

                    var changed = false;
                    if (this.hour < settings.startHour) {
                        settings.startHour = this.hour;
                        changed = true;
                    }
                    if (this.hour + (this.duration / 60) > settings.endHour) {
                        settings.endHour = Math.ceil(this.hour + (this.duration / 60));
                        changed = true;
                    }
                    if (this.dow < settings.startDay) {
                        settings.startDay = this.dow;
                        changed = true;
                    }
                    if (this.dow > settings.endDay) {
                        settings.endDay = this.dow;
                        changed = true;
                    }
                    this._attach();


                    if (changed === true) {
                        $(container).trigger("tt.update");
                    }

                    this._setColour();

                },
                content: function() {
                    return this.title + "<br />" + this.hour + ":" + this.minute + " - " + this.duration + " Minutes";
                },
                _setColour: function() {
                    var baseColour = this.activityObj.css("background-color");
                    if (this.color)
                        baseColour = this.color;
                    if (this.colour)
                        baseColour = this.colour;


                    if ($.isFunction($.Color)) {

                        var startColour = $.Color(baseColour);
                        var lightness = startColour.lightness();
                        var change = lightness / 4;
                        var endColour = startColour.lightness("-=" + change);

                        var css = {
                            background: 'linear-gradient(127deg, ' + startColour.toHexString() + ' 25%, ' + endColour.toHexString() + ' 100%)'
                        }
                        this.activityObj.css(css);
                    }
                    this.activityObj.css({"background-color": baseColour});
                },
                _attach: function() {
                    var content = "";
                    if ($.isFunction(this.content)) {
                        content = $.proxy(this.content, this);
                        this.activityObj.html(content());
                    } else
                        this.activityObj.html(content);
                },
                remove: function() {
                    this.activityObj.fadeOut("slow").remove();
                },
                activityCSSObj: {
                    position: "absolute"
                },
                setPosition: function(position) {
                    var ref = posRef[this.orientation()];
                    var that = this;
                    $.each(position, function(key, value) {
                        that.activityCSSObj[ref[key]] = value;
                    });
                },
                render: function() {
                    this.container.append(this.activityObj);
                    this.activityObj.css(this.activityCSSObj);
                    this.activityObj.fadeIn("slow");
                },
                events: {
                    "focus mouseenter": function() {
                        var content = (this.activityObj) ? this.activityObj : this;
                        if (content.expanded != true) {
                            content.expanded = true;
                            var position = $(content).position();
                            content.oldH = $(content).height();
                            content.oldW = $(content).width();
                            content.oldT = position.top;
                            content.oldL = position.left;
                            this.to = setTimeout(function() {
                                var css = {
                                    "z-index": settings.ActivityOptions.zindex+2
                                };
                                $(content).css({
                                    "z-index": settings.ActivityOptions.zindex+2,
                                    "box-shadow": "0 6px 10px rgba(0,0,0,0.75)"
                                });
                                var width = Math.max(content.scrollWidth, defaultOptions.ActivityOptions.mouseoverMinWidth) + 5;
                                var height = Math.max(content.scrollHeight, defaultOptions.ActivityOptions.mouseoverMinHeight);
                                var diffH = height - content.oldH;
                                var diffW = width - content.oldW;
                                if (diffH > 0) {
                                    css['top'] = "-=" + diffH / 2;
                                    css['height'] = "+=" + diffH;
                                }
                                if (diffW > 0) {
                                    css['left'] = "-=" + diffW / 2;
                                    css['width'] = "+=" + diffW;
                                }

                                $(content).animate(css, defaultOptions.ActivityOptions.mouseoverSpeed, defaultOptions.ActivityOptions.mouseoverEasing);

                            }, defaultOptions.ActivityOptions.mouseoverDelay);
                        }
                    },
                    "blur mouseleave": function() {
                        clearTimeout(this.to);
                        if (this.expanded == true) {
                            this.expanded = false;
                            var css = {
                                 width: this.oldW,
                                 height: this.oldH,
                                 top: this.oldT,
                                 left: this.oldL,
                                 "z-index": settings.ActivityOptions.zindex
                             };
                            $(this).css({
                                "box-shadow": "none"
                            });
                            
                            $(this).animate(css, defaultOptions.ActivityOptions.mouseoverSpeed, defaultOptions.ActivityOptions.mouseoverEasing);
                            $(this).removeClass('tt-activity-expanded');

                        }
                    }
                }


            }, settings.ActivityOptions, data);

            A._init();

            $(A.activityObj).on(A.events);

            return A;
        };

        var NowLine = function() {
            var NL = new OptionsDependant(container);

            var posRef = {
                landscape: {
                    size: "width",
                    nonsize: "height",
                    position: "left",
                    nonposition: "top"
                },
                portrait: {
                    size: "height",
                    nonsize: "width",
                    position: "top",
                    nonposition: "left"
                }
            };

            $.extend(true, NL, {
                now: new Date(),
                init: function() {
                    var that = this;
                    if (settings.nowLineEnable && this.isDayView()) {
                        this.container.on("tt.dayChange", function() {
                            if (that.container.find('.tt-today')[0]) {
                                that.render();
                            }
                        });
                    }
                },
                render: function() {
                    var hourIndex = this.now.getHours() - settings.startHour,
                            hourOffset = (settings.hourSize / 60) * this.now.getMinutes();

                    if (this.element) {
                        this.element.remove();
                    }
                    if (this.now.getHours() >= settings.startHour &&
                            this.now.getHours() <= settings.endHour)
                    {
                        var cssObj = {
                            "position": "absolute",
                            "z-index": settings.ActivityOptions.zindex + 1
                        };
                        cssObj[posRef[this.orientation()].size] = "2px";
                        cssObj[posRef[this.orientation()].nonsize] = "100%";
                        cssObj[posRef[this.orientation()].position] = (hourIndex * settings.hourSize) + hourOffset + settings.titleSize;//settings.dayTitleSize;
//                         console.log(cssObj);

                        this.element = $("<div/>", {"class": "tt-nowLine", "aria-hidden": "true"}).css(cssObj);
                        this.container.find('.tt-today').append(this.element);
                    }
                }
            });

            return NL;
        }

        var MessageOverlay = function() {
            var MO = new OptionsDependant(container);

            $.extend(true, MO, {
                overlay: $("<div/>", {"class": "tt-overlay", style: "display: none;"}).append($("<div/>", {"class": "tt-message"}).html("No Message")),
                init: function() {
                    $(container).append(this.overlay);

                    $(this.overlay).css({
                        "position": "relative",
                        "z-index": settings.ActivityOptions.zindex + 10
                    });

                    $(".tt-message", this.overlay).css({
                        position: "absolute",
                        opacity: 1

                    });
                },
                show: function(message) {
                    $('.tt-message', this.overlay).html(message);
                    this.overlay.fadeIn();
                    this.resize();
                },
                hide: function() {
                    this.overlay.fadeOut();
                },
                resize: function() {
                    var width = $(container).width();
                    var height = $(container).height();
                    var top = 0;
                    var left = 0;

                    this.overlay.css({
                        width: width,
                        height: height,
                        top: top,
                        left: left
                    });

                    var overlayMsg = $(".tt-message", this.overlay);
                    overlayMsg.css({
                        top: ($(container).height() - overlayMsg.height()) / 2,
                        left: ($(container).width() - overlayMsg.width()) / 2

                    });
                }
            });

            $(container).on({
                "tt-noActivities": function(event) {
                    MO.show($.isFunction(settings.NoContentMsg) ? settings.NoContentMsg() : settings.NoContentMsg);
                },
                "tt.container.updated": function(event) {
                    MO.resize();
                },
                "tt-activitiesRendered": function(event) {
                    MO.hide();
                },
                "tt-activitiesLoading": function(event) {
                    MO.show($.isFunction(settings.loadingMsg) ? settings.loadingMsg() : settings.loadingMsg);
                },
                "tt-renderStart": function(event) {
                    MO.show("Rendering Timetable");
                },
                "tt-activityLoadFailed": function(event) {
                    MO.show($.isFunction(settings.loadErrorMsg) ? settings.loadErrorMsg() : settings.loadErrorMsg);
                }

            });

            return MO;
        }
        var tt = createTimeTable();
        $(window).on("resize", function() {
            $(container).trigger("tt.update");
        });
        return tt;
    };

    $.widget.bridge("timetable", TimeTable);

})(jQuery);

