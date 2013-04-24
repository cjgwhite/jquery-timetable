var TimeTable = function(options, container) {
    
    var defaultOptions = {
        orientation: "landscape",
        minHourSize: 50,
        minDaySize: 50,
        startHour: 9,
        endHour: 17,
        startDay: 1,
        endDay: 5,
        activities: [],
        hoursOptions: {
            events: {}
        },
        daysOptions: {
            events: {}
        },
        ActivityOptions: {
            mouseoverDelay: 500,
            mouseoverMinHeight: 0,
            mouseoverMinWidth: 0,
            mouseoverEasing: "easeOutElastic",
            mouseoverSpeed: "normal",
            events: {}
        }
    };

    var OptionsDependant = function(container) {
        this.container = $(container);
    };
    OptionsDependant.prototype = {
        options: $.extend(
                true,
                defaultOptions,
                options
                )
    }

    function createTimeTable() {
        return $.extend(
                true,
                new OptionsDependant(container),
                {
                    hoursContainer: new HoursContainer(),
                    daysContainer: new DaysContainer(),
                    name: "timetable",
                    _create: function() {
                        var cssObj = {
                            "position": "relative"
                        };
                        $(this.container)
                                .addClass("tt-container")
                                .css(cssObj);
                    },
                    _init: function() {          
                        this.hoursContainer.init();
                        this.daysContainer.init();
                        this.resize();
                    },
                    option: function(key, value) {

                        if ($.isPlainObject(key)) {
                            this.options = $.extend(true, this.options, key);
                            $.each(key, $.proxy(function(key, val) {
                                var evnt = {
                                    type: key + "Changed",
                                    newValue: val
                                }
                                this.container.trigger(evnt);
                            }, this));

                        } else if (key && typeof value === "undefined") {
                            return this.options[ key ];
                        } else {
                            this.options[ key ] = value;
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
                            this.options.activities = activityList;
                        }
                        
                        this.daysContainer.renderActivities();

                    },
                    refresh: function() {
                        this.activityContainer.render();
                    },
                    resize: function() {
                        
                        $(this.container).trigger("tt.update");

                    }
                }
        );
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
                    aHours.push($("<div/>", {"class": "tt-hour", style: "width: 100%;"}).text(hourStr).on(this.events));
                }
                return aHours;
            },
            render: function() {
                this.container.append(this.hours.slice(this.options.startHour, this.options.endHour + 1));
                this.hour = this.options.endHour - this.options.startHour;
                this.resize();
            },
            resize: function() {
                this.options.hourSize = parseInt(this.container.css(posRef[this.options.orientation].size)) / (this.hour + 2);
                this.options.hourNumber = this.hour;

                if (this.options['minHourSize'] != null && this.options.hourSize < this.options.minHourSize) {
                    this.options.hourSize = this.options.minHourSize;

                    var cssObj = {};
                    cssObj[posRef[this.options.orientation].size] = this.options.hourSize * (this.hour + 2);
                    this.container.css(cssObj);

                }
                var size = this.options.hourSize;
                var offset = size;
                var that = this;
                $("div.tt-hour", this.container).each(function(index, el) {
                    var cssObj = {
                        position: "absolute",
                        height: "100%"
                    };
                    cssObj[posRef[that.options.orientation].size] = size;
                    cssObj[posRef[that.options.orientation].nonsize] = "100%";
                    cssObj[posRef[that.options.orientation].position] = offset + (size * index);
                    cssObj[posRef[that.options.orientation].nonposition] = 0;
                    $(this).css(cssObj);
                });
            }

        }, HC.options.hoursOptions);

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
                this.render();
            },
            _generateDays: function() {
                return [
                    $("<div/>", {"class": "tt-day"}).text(this.dayNames[this.lang][0]).on(this.events),
                    $("<div/>", {"class": "tt-day"}).text(this.dayNames[this.lang][1]).on(this.events),
                    $("<div/>", {"class": "tt-day"}).text(this.dayNames[this.lang][2]).on(this.events),
                    $("<div/>", {"class": "tt-day"}).text(this.dayNames[this.lang][3]).on(this.events),
                    $("<div/>", {"class": "tt-day"}).text(this.dayNames[this.lang][4]).on(this.events),
                    $("<div/>", {"class": "tt-day"}).text(this.dayNames[this.lang][5]).on(this.events),
                    $("<div/>", {"class": "tt-day"}).text(this.dayNames[this.lang][6]).on(this.events)
                ];
            },
            render: function() {
                this.container.append(this.days.slice(this.options.startDay, this.options.endDay + 1));
                this.day = this.options.endDay - this.options.startDay;
                this.resize();
            },
            daysActivities: new Array(),
            renderActivities: function() {
                $('.tt-event', this.container).remove();
                
                $.each(this.daysActivities, function (index, activity){
                    activity.remove();
                    delete activity;
                });
                
                var activities = [];
                if ($.isFunction(this.options.activities)) {
                    activities = this.options.activities();
                } else {
                    activities = this.options.activities;
                }
                
                $.each(activities, $.proxy(function(index, activityData){

                    var activity = new Activity(this.days[activityData.scheduledDay],activityData);
                    
                    this.daysActivities.push(activity);
                },this));
            },
            addActivity: function(activity) {
                var day = this.days[activity.dow];
                activity.container = day;
                activity._attach();
            },
            resize: function() {

                this.options.daySize = parseInt(this.container.css(posRef[this.options.orientation].size)) / (this.day + 2);

                if (this.options['minDaySize'] != null && this.options.daySize < this.options.minDaySize) {
                    this.options.daySize = this.options.minDaySize;

                    var cssObj = {};
                    cssObj[posRef[this.options.orientation].size] = this.options.daySize * (this.day + 2);
                    this.container.css(cssObj);

                }

                var size = this.options.daySize;
                var offset = size;

                this.options.dayNumber = this.day;

                var that = this;
                $("div.tt-day", this.container).each(function(index, el) {
                    var cssObj = {
                        position: "absolute"
                    };
                    cssObj[posRef[that.options.orientation].size] = size;
                    cssObj[posRef[that.options.orientation].nonsize] = "100%";
                    cssObj[posRef[that.options.orientation].position] = offset + (size * index);
                    cssObj[posRef[that.options.orientation].nonposition] = 0;
                    $(this).css(cssObj);
                });
            }
        }, DC.options.daysOptions);
        
        $(container).on("activitiesChanged", $.proxy(DC.renderActivities, DC));

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
            activityObj: $("<div/>", {"class": "tt-event", style: "position: relative; display: none;", "tabindex": 0}),
            _init: function() {
                
                var start = this.startTime.split(":");

                this.dow = parseInt(this.scheduledDay);
                this.hour = parseInt(start[0],10);
                this.minute = parseInt(start[1],10);

                var changed = false;
                if (this.hour < this.options.startHour) {
                    this.options.startHour = this.hour;
                    changed = true;
                }
                if (this.hour + (this.duration / 60) > this.options.endHour) {
                    this.options.endHour = Math.ceil(this.hour + (this.duration / 60));
                    changed = true;
                }
                if (this.dow < this.options.startDay) {
                    this.options.startDay = this.dow;
                    changed = true;
                }
                if (this.dow > this.options.endDay) {
                    this.options.endDay = this.dow;
                    changed = true;
                }
                this._attach();


                if (changed === true) {
                    $(container).trigger("tt.update");
                } else {
                    this.resize();
                }
                
                this._setColour();
                $(this.container).on("activityAdded", $.proxy(this._onActivityAdded,this));
                
            },
            overlaps: new Array(),

            addOverlap: function(overlap) {
                this.overlaps.push(overlap);
            },

            _onActivityAdded : function(event) {
                if (this.overlapWith(event.activity)) {
                    this.negotiatePosition(event.activity);
                    this.addOverlap(event.activity);
                    event.activity.addOverlap(this);
                }
                this.container.trigger("tt.event.update");
            },
            overlapWith: function(activity) {
                var thisTime = (this.hour*60) + this.minute;
                var thatTime = (activity.hour*60) + activity.minute;
                if (
                        (thisTime >= thatTime && thisTime < thatTime+activity.duration) ||
                        (thatTime >= thisTime && thatTime < thisTime+this.duration)    
                )
                        return true;
            },
            negotiatePosition: function(activity) {
                    if (activity.sizeFactor < this.sizeFactor) {
                        activity.sizeFactor++;
                    } else if (activity.sizeFactor > this.sizeFactor) {
                        this.sizeFactor++;
                    } else {
                        activity.sizeFactor++;
                        this.sizeFactor++;
                    }
            
                        var positions = new Array();
                        positions.push(this.position);
                        $.each(activity.overlaps, function (index, overlap) {
                            positions.push(overlap.position);
                        });
                        while ($.inArray(activity.position, positions) != -1)
                            activity.position++;

                    
            },
            position: 0,
            sizeFactor: 1,

            content: function() {
                return this.title + "<br />" + this.hour + ":" + this.minute   + " - " + this.duration + " Minutes";
            },
            _setColour: function() {
                var baseColour = this.activityObj.css("background-color");
                if (this.color) baseColour = this.color;
                if (this.colour) baseColour = this.colour;
                
                this.activityObj.css({"background-color": baseColour});
                if ($.isFunction($.Color)) {
                    
                    var startColour = $.Color(baseColour);
                    var lightness = startColour.lightness();
                    var change = lightness/4;
                    var endColour = startColour.lightness("-="+change);
                    
                    var css = {
                        background: 'linear-gradient(120deg, '+startColour.toHexString()+' 30%, '+endColour.toHexString() +' 70%)'
                    }
                    
                    this.activityObj.css(css);
                    
                }
                
            },
            _attach: function() {
                var content = "";
                if ($.isFunction(this.content)) {
                    content = $.proxy(this.content, this);
                    this.activityObj.html(content());
                } else
                    this.activityObj.html(content);
                this.container.append(this.activityObj);
                this.container.trigger({
                    type: "activityAdded",
                    activity: this
                });
                this.activityObj.fadeIn("slow");
                this.resize();
            },
            remove: function() {
                this.activityObj.fadeOut("slow").remove();
                $(this.container).off("activityAdded", this._onActivityAdded);
            },

            resize: function() {
                var dayIndex = this.dow - this.options.startDay;
                var hourIndex = this.hour - this.options.startHour + 1;
                var hourOffset = (this.options.hourSize / 60) * this.minute;

                var cssObj = {
                    position: "absolute"
                };
        
                
                var expandto = {
                    position: 1000000,
                    sizeFactor: 0
                };
                $.each(this.overlaps, $.proxy(function(index, activity) {
                    if (activity.position > this.position && activity.position <= expandto.position && activity.sizeFactor >= expandto.sizeFactor)
                        expandto = activity;
                },this));

                //var activityWidth = this.options.daySize / (this.sizeFactor + (this.sizeFactor*sf));
                var activityWidth = (this.options.daySize) / (this.sizeFactor);
                
                cssObj[posRef[this.options.orientation].hour] = (hourIndex * this.options.hourSize) + hourOffset;
                cssObj[posRef[this.options.orientation].day] = (activityWidth*this.position)+this.activityMargin;// 0;//(dayIndex * this.options.daySize) + (this.options.daySize * 0.1);
                cssObj[posRef[this.options.orientation].size] = this.duration * (this.options.hourSize / 60)- this.activityMargin;
                if (expandto.sizeFactor > 0 && (activityWidth*this.position + activityWidth) != ((this.options.daySize/expandto.sizeFactor) * expandto.position )) {
                    activityWidth += ((this.options.daySize/expandto.sizeFactor) * expandto.position ) - (activityWidth*this.position + activityWidth);
                    cssObj[posRef[this.options.orientation].nonsize] = activityWidth - this.activityMargin -1;//"100%";//this.options.daySize * 0.8;
                } else
                    cssObj[posRef[this.options.orientation].nonsize] = activityWidth - (this.activityMargin*2) -1;//"100%";//this.options.daySize * 0.8;
                

                this.activityObj.css(cssObj);
                var content = $.proxy(this.content, this);
                    this.activityObj.html(content());
                
            },
            events: {
                "focus mouseenter": function(){
                         var content = (this.activityObj) ? this.activityObj : this;
                         if (content.expanded != true) {
                             content.expanded = true;
                            var position  = $(content).position();
                            content.oldH = $(content).height();
                            content.oldW = $(content).width();
                            content.oldT = position.top;
                            content.oldL = position.left;
                            this.to = setTimeout(function () {
                                var css = {};
                                $(content).css({
                                       "z-index": 1000,
                                       "box-shadow": "0 6px 10px rgba(0,0,0,0.75)"
                                });
                                var width = Math.max(content.scrollWidth, defaultOptions.ActivityOptions.mouseoverMinWidth) + 5;
                                var height = Math.max(content.scrollHeight, defaultOptions.ActivityOptions.mouseoverMinHeight);
                                var diffH = height - content.oldH;
                                var diffW = width - content.oldW;
                                if(diffH > 0) {
                                    css['top'] = "-="+diffH/2;
                                    css['height'] = "+="+diffH;
                                }
                                if (diffW > 0) {
                                    css['left'] = "-="+diffW/2;
                                    css['width'] = "+="+diffW;
                                }

                                   $(content).animate(css, defaultOptions.ActivityOptions.mouseoverSpeed, defaultOptions.ActivityOptions.mouseoverEasing);

                            }, defaultOptions.ActivityOptions.mouseoverDelay);
                        }
                },
                "blur mouseleave": function() {
                         clearTimeout(this.to);
                         if (this.expanded == true) {
                             this.expanded = false;
                         $(this).css({
                                    "z-index": 0,
                                    "box-shadow": "none"
                             });

                            $(this).animate({width: this.oldW, height: this.oldH, top: this.oldT, left: this.oldL, "z-index":0}, defaultOptions.ActivityOptions.mouseoverSpeed, defaultOptions.ActivityOptions.mouseoverEasing);

                         }
                }
            }


        }, A.options.ActivityOptions, data);
        
        

        $(container).on("tt.event.update", $.proxy(function() {
            this.resize()
        }, A));

        $(container).on("tt.container.updated", function(event) {
            A.resize();
            event.stopPropagation();
        });

        A._init();
        
        $(A.activityObj).on(A.events);
        
        return A;
    };


    var tt = createTimeTable();


    // attach event Handlers
    $(window).on("resize", $.proxy(function() {
        $(this.container).trigger("tt.update");
    }, tt));
    $(container).on("tt.changed", $.proxy(function(event) {
        $(this.container).trigger("tt.update");
    }, tt));
    $(container).on("tt.update", $.proxy(function(event) {
        this.hoursContainer.render();
        this.daysContainer.render();
        
        //this.activityContainer.resize();
        $(container).trigger("tt.container.updated");
        event.stopPropagation();
    }, tt));
    $(container).on("activitiesChanged", $.proxy(function(evnt) {
        //this.activityContainer.render();
        this.render();
    }, tt));

    tt._init();
    tt._create();
    tt.render();
    return tt;
};

$.widget.bridge("timetable", TimeTable);


