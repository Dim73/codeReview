(function($) {
    $.fn.news = function(opt) {
        var opt = $.extend({
            feedPrefix: '.b-news-feed',
            feedContainer: '__wrap',
            newsFilterCont: '-filter',
            newsFilter: '-filter__variant',
            filterPane: '-filter__sort',
            newsFilterGroup: '-filter__list',
            newsFilterSort: '-filter__sort',
            newsFilterCalendar: '-filter__variant_calendar',
            newsFilterBrand : '-filter-brands__item',
            newsFilterClose : '-filter__close',
            newsVariantBrand : '-filter__variant_brand',
            sortVariant: '.variant_sort',
            newsItem: '__item',
            btnLoad: '.js-loadNews',
            newsRead: '.b-news',
            newsReadLoad: '__inner',
            newsReadClose: '__close',
            feedLoadUrl: 'data/newsFeed.html',
            newsLoadUrl: 'data/news.html',
            openSortClass: '.js-open-sort',
            sortApplyClass: '.js-sort-apply',
            variantFilter : '.variant-filter',
            filterLoad: '.ajx-load-content',
            historyPath: '/',
            selfRender: null
        }, opt);

        return this.each(function() {
            var $self = $(this),
                documentTitle = document.title,
            // isSpecial = $self.is(opt.feedPrefix+'--special'),
                feedUrl = opt.feedLoadUrl,
                newsUrl =  opt.newsLoadUrl,
                historyPath = opt.historyPath;//isSpecial?'/adv/sp/':'/press/';

            var nFilter = {
                init: function() {
                    var self = this;
                    self.param = {};
                    self.data = [];
                    self.$group = $(opt.feedPrefix+opt.newsFilterGroup,$self);
                    self.$filterCont = $(opt.feedPrefix+opt.newsFilterCont,$self);
                    self.$filter = $(opt.feedPrefix+opt.newsFilter,$self);
                    self.$filterPane = $(opt.feedPrefix+opt.filterPane,$self);
                    self.$sort = $(opt.feedPrefix+opt.newsFilterSort,$self);
                    self.$variantFilter = $(opt.variantFilter,$self);
                    self.$calendarRange = $(opt.feedPrefix+opt.newsFilterCalendar,$self);
                    self.$sortApply = $(opt.sortApplyClass,$self);
                    self.$brands = $(opt.feedPrefix+opt.newsFilterBrand,$self);
                    self.$brandVariant = $(opt.feedPrefix+opt.newsVariantBrand,$self);
                    self.defCalendarTxt = self.$calendarRange.text();
                    self.$sortVariant = $(opt.sortVariant,$self);
                    self.$btnClose = $(opt.feedPrefix + opt.newsFilterClose);
                    self.clearDate = false;

                    window.moment = Kalendae.moment;
                    moment.locale('ru');
                    var fCalendar = new Kalendae('filter-calendar',{mode: 'range', rangeDelimiter: ',', dayAttributeFormat: 'DD.MM.YYYY', weekStart: 1, titleFormat: 'MMMM YYYY'});
                    fCalendar.subscribe('change', function (date, action) {
                        if (self.clearDate) {
                            self.clearDate = false;
                            return;
                        }

                        var selectedDates = (this.getSelected().split(','));
                        if (selectedDates[0] == selectedDates[1]) {
                            self.clearDate = true;
                            fCalendar.removeSelected(selectedDates[0], false);
                            fCalendar.removeSelected(selectedDates[1], false);
                            selectedDates = [];
                        }
                        if (selectedDates.length && selectedDates[0]) {
                            selectedDates[0] = moment(selectedDates[0]).format('DD.MM.YY');
                            if (selectedDates[1]) {
                                selectedDates[1] = moment(selectedDates[1]).format('DD.MM.YY');
                            }
                            self.$calendarRange.html('<span class="date-wrap">' + selectedDates[0] + (!!selectedDates[1]?'&ndash;' + selectedDates[1]:'')+'</span>');
                            if (!selectedDates[1]) {
                                selectedDates[1] = selectedDates[0];
                            }
                            self.dateStart = selectedDates[0];
                            self.dateEnd = selectedDates[1];
                            for (var n in self.data) {
                                for (var i in self.data[n].groupVariants) {
                                    var cv = self.data[n].groupVariants[i];
                                    if (!cv.isActive && cv._value === 'calendar') {
                                        self.setActive(n,i);
                                    }
                                }
                            }
                        } else {
                            self.$calendarRange.html(self.defCalendarTxt);
                            self.dateStart = self.dateEnd = '';
                        }
                    });
                    self.calendar = fCalendar;

                    //scrollъ
                    self.$filterCont.addClass('loading');
                    setTimeout(function(){
                        self.scorllInit();
                        //высота панели фильтра
                        var tmpHeight = 0;
                        $('.b-news-feed-filter-brands, .b-news-feed-filter__select').each(function(){
                            if (tmpHeight < $(this).height()) {
                                tmpHeight = $(this).height();
                            }
                            $(this).closest('.b-news-feed-filter-choose').height(tmpHeight);
                        });
                        self.filterHeight = self.$filterPane.height();
                        self.$filterPane.addClass('is-set');
                        self.$filterCont.removeClass('loading');
                    }, 1500);


                    self.clearInput(true);
                    self.$group.each(function(){
                        var $group = $(this),
                            gVariants = [],
                            gAlias = '';

                        self.$filter.each(function(){
                            if ($(this).parent().is($group)) {
                                var $elm = $(this),
                                    forFilter = $(this).data('filter').split(',')[1],
                                    $filter = $('.variant-filter[data-for='+forFilter+']'),
                                    $rChild = $('.variant-filter[data-for='+$elm.data('relation')+']');

                                gVariants.push({
                                    elm: $elm,
                                    isDefault: $elm.is('.active'),
                                    isActive: $elm.is('.active'),
                                    _value: forFilter,
                                    curValue: forFilter,
                                    isFilter: $filter.length,
                                    _filter: $filter,
                                    relationChild: $rChild.length?$rChild:false
                                });
                                if (!gAlias) {
                                    gAlias = $(this).data('filter').split(',')[0];
                                }

                                var curVariant = gVariants[gVariants.length-1];
                                if ($elm.is('.active')) {
                                    self.param[gAlias] = curVariant.curValue;
                                }

                                (function(currentGroup, currentVariant){
                                    $elm.click(function(){
                                        self.setVariant(currentGroup, currentVariant);
                                        return false;
                                    });

                                    if (!!curVariant.relationChild) {
                                        if (curVariant.isFilter) {
                                            $('input',curVariant._filter).change(function(){
                                                self.filterSetValues(currentGroup, currentVariant, true);
                                                self.updateRelationship(currentGroup,currentVariant);
                                            });
                                            self.$relationVariant = $('input',curVariant._filter).filter('.active');
                                        }
                                    }
                                })(self.data.length, $elm.index());
                            }
                        });

                        self.data.push({
                            group: gAlias,
                            groupVariants: gVariants
                        });
                    });

                    //default category filter change
                    if (!!self.$relationVariant && self.$relationVariant.length) {
                        self.$relationVariant.trigger('change');
                    }

                    //apply btn
                    self.$sortApply.bind('click',function(){
                        self.setFilter();
                        self.sortToggle(false);
                        self.applyFilter();
                        return false;
                    });

                    $(window).bind('app.escape',function(){
                        self.sortToggle(false);
                    });

                    $(window).bind('app.click',function(e,ref){
                        if ($(ref.target).closest(self.$filterCont).length) return;
                        self.sortToggle(false);
                    });

                    self.$btnClose.click(function(){
                        self.sortToggle(false);
                        return false;
                    });
                    self.applyFilter();

                },
                setVariant: function(cG, cV) {
                    var self = this;
                    self.cG = cG;
                    self.cV = cV;
                    if (self.data[cG].groupVariants[cV].isActive && !self.data[cG].groupVariants[cV].isFilter) return;
                    if (self.data[cG].groupVariants[cV].isFilter) {
                        if (self.data[cG].groupVariants[cV].isActive) {
                            self.sortToggle();
                        } else {
                            self.setActive(cG, cV);
                            self.sortToggle(true);
                        }
                        self.data[cG].groupVariants[cV]._filter.css('visibility','visible');
                    } else {
                        self.setActive(cG, cV);
                        self.setDefault(cG);
                        self.sortToggle(false);
                        self.applyFilter();
                    }
                },
                updateRelationship: function(cG, cV) {
                    var self = this;
                    var cv = self.data[cG].groupVariants[cV];
                    $.ajax({
                        url: opt.relationFiltersUrl,
                        data: {ids: cv.curValue},
                        type: 'POST',
                        success: function(response){
                            cv.relationChild.find('.ajx-load-content').html(response);
                            cv.relationChild.find('input:checkbox').styler({selectSearch:false});
                            self.scorllInit(cv.relationChild);
                        },
                        error:  function(xhr, str){
                        }
                    });
                },
                setActive: function(cG, cV) {
                    var self = this;
                    for (var i in self.data[cG].groupVariants) {
                        self.data[cG].groupVariants[i].isActive = false;
                        self.data[cG].groupVariants[i].elm.removeClass('active');

                    }
                    self.data[cG].groupVariants[cV].isActive = true;
                    self.data[cG].groupVariants[cV].elm.addClass('active');
                    //hide unactive sort
                    for (var n in self.data) {
                        for (var i in self.data[n].groupVariants) {
                            if (!self.data[n].groupVariants[i].isActive) {
                                self.data[n].groupVariants[i]._filter.css('visibility','hidden');
                            }
                        }
                    }
                },
                sortToggle: function(isOpen) {
                    //isOpen = isOpen || !$self.is('.sort-is-open');
                    var self = this;
                    $self.toggleClass('sort-is-open',isOpen);
                    if (isOpen) {
                        self.$filterPane.height(self.filterHeight);
                        for (var n in self.data) {
                            for (var i in self.data[n].groupVariants) {
                                if (self.data[n].groupVariants[i].isActive && self.data[n].groupVariants[i].isFilter) {
                                    self.data[n].groupVariants[i]._filter.css('visibility','visible');
                                }
                            }
                        }
                    } else if (isOpen == false) {
                        self.$filterPane.height(0);
                    } else {
                        self.$filterPane.height(self.$filterPane.height() > 0?0:self.filterHeight);
                    }
                },
                setDefault: function(cG) {
                    var self = this;
                    for (var i in self.data[cG].groupVariants) {
                        self.data[cG].groupVariants[i].isDefault = self.data[cG].groupVariants[i].isActive;
                    }
                },
                revertDefault: function(cG) {
                    var self = this,
                        defFind = false;
                    for (var i in self.data[cG].groupVariants) {
                        if (self.data[cG].groupVariants[i].isDefault) {
                            self.setActive(cG,i);
                            self.setDefault(cG);
                            defFind = true;
                        }
                    }

                    if (!defFind) {
                        self.setActive(cG,0);
                        self.setDefault(cG);
                    }
                },
                setFilter: function() {
                    var self = this;
                    for (var n in self.data) {
                        for (var i in self.data[n].groupVariants) {
                            self.filterSetValues(n,i);
                        }
                    }
                },
                filterSetValues: function(n,i, onlySet) {
                    var self = this;
                    var cv = self.data[n].groupVariants[i],
                        filterIsFill = false;
                    if (cv.isFilter) {
                        if (cv.isActive) {
                            if (cv._value === 'calendar') {
                                if (self.dateStart && self.dateEnd) {
                                    cv.curValue = [self.dateStart, self.dateEnd];
                                    self.setDefault(n);
                                    filterIsFill = true;
                                }
                            } else {
                                var tmp = [];
                                $('input[type=checkbox]',cv._filter).each(function(){
                                    var $thisCheckbox = $(this);
                                    if ($thisCheckbox.is(':checked')) {
                                        tmp.push($thisCheckbox.val());
                                    }
                                });
                                if (tmp.length) {
                                    cv.curValue = tmp;
                                    self.setDefault(n);
                                    filterIsFill = true;
                                } else {
                                    cv.curValue = [];
                                }
                            }
                            if (!filterIsFill && !onlySet) {
                                cv.isDefault = false;
                                self.revertDefault(n);
                            }
                        }
                    } else {
                        if (self.data[n].group === 'sort' && i == 0 && cv.isActive) {
                            var old_dates = self.calendar.parseDates(self.calendar.getSelected(), self.calendar.settings.parseSplitDelimiter, self.calendar.settings.format);
                            var d = old_dates.length;
                            while(d--) { self.calendar.removeSelected(old_dates[d]._i); }
                        }

                        if (self.data[n].group === 'choose-by' && i == 0 && cv.isActive) {
                            self.clearInput();
                        }
                    }
                },
                applyFilter: function() {
                    var self = this;
                    self.setFilter();
                    for (var n in self.data) {
                        for (var i in self.data[n].groupVariants) {
                            if (self.data[n].groupVariants[i].isDefault) {
                                /*console.log(self.data[n].groupVariants[i]);*/
                                if (self.data[n].groupVariants[i].isFilter) {
                                    self.param[self.data[n].group] = {};
                                    self.param[self.data[n].group][self.data[n].groupVariants[i]._value] = self.data[n].groupVariants[i].curValue;
                                } else {
                                    self.param[self.data[n].group] = self.data[n].groupVariants[i].curValue;
                                }
                            }
                        }
                    }
                    nFeed.load(true);
                },
                getParam: function() {
                    var self = this;
                    return self.param;
                },
                clearInput: function(filterActive) {
                    var self = this,
                        $checkboxes;
                    if (filterActive) {
                        $checkboxes = self.$brands.find('input[type=checkbox]').not('.active');
                    } else {
                        $checkboxes =self.$brands.find('input[type=checkbox]');
                    }
                    $checkboxes.each(function(){
                        $(this).removeAttr('checked').trigger('refresh');
                    });
                },
                getVariant : function(val, func) {
                    for (var n in self.data) {
                        for (var i in self.data[n].groupVariants) {
                            var cv = self.data[n].groupVariants[i];
                            if (cv._value === val) {
                                return func(cv, [n,i]);
                            }
                        }
                    }
                },
                scorllInit : function(elm) {
                    var $scroller = elm || this.$variantFilter;
                    if ($scroller.find('.nano-content').length) {
                        $scroller.nanoScroller({sliderMaxHeight: 50, iOSNativeScrolling: false});
                    }
                }
            };

            var nFeed = {
                init: function() {
                    var self = this;
                    self.url = feedUrl;
                    self.page = 0;
                    self.reset = false;
                    self.$feedContainer = $(opt.feedPrefix+opt.feedContainer,$self);
                    self.$item = $(opt.feedPrefix+opt.newsItem,$self);
                    self.$btnLoad = $(opt.btnLoad);
                    self.$colLeft = $(opt.feedPrefix + '__col_left');
                    self.$colCenter = $(opt.feedPrefix + '__col_center');
                    self.$colRight = $(opt.feedPrefix + '__col_right');
                    /*    self.$feedContainer.masonry ({
                     columnWidth: 1,
                     itemSelector: '.masonry-item'
                     });*/
                    self.$btnLoad.bind('click',function(){
                        self.load();
                        return false;
                    });
                },
                load : function(reset) {
                    var self = this;
                    self.reset = !!reset;

                    $.ajax({
                        url: self.url,
                        data: self.getPostData(),
                        type: 'POST',
                        dataType: 'JSON',
                        success: function(response){
                            self.$btnLoad.toggle(response.button);
                            (opt.selfRender &&  opt.selfRender(response, self.page)) || self.render(response);
                        },
                        error:  function(xhr, str){
                        }
                    });
                },
                getPostData : function() {
                    var self = this;
                    var filterParam = nFilter.getParam();
                    filterParam.page = self.page = self.reset?0:++self.page;
                    return filterParam;
                },
                render : function (response) {
                    var self = this;
                    var $newData = $(response.data);
                    var isPrevMain = false;
                    var itemCount = 0;
                    var itemsLeft = itemsCenter = itemsRight = '';
                    if (self.reset) {
                        self.reset = false;
                        self.$colLeft.html('');
                        self.$colRight.html('');
                        self.$colCenter.html('');
                    }


                    $newData.each(function() {
                        var $self = $(this);
                        switch(itemCount%4) {
                            case 0:  itemsLeft += $self[0].outerHTML;
                                break;
                            case 3:  itemsRight += $self[0].outerHTML;
                                break;
                            default: itemsCenter += $self[0].outerHTML;
                                break;
                        }
                        if ($self.is('.m__main')) {
                            ++itemCount;
                        }
                        ++itemCount
                    });

                    self.$colLeft.append(itemsLeft);
                    self.$colRight.append(itemsRight);
                    self.$colCenter.append(itemsCenter);
                    self.newsAnimate();
                },
                reset: function () {
                    var self = this;
                    self.page = 0;
                    self.reset = true;
                },
                newsAnimate: function() {
                    setTimeout(function(){$('.news_load').removeClass('news_load')},500);
                }
            };

            var nShow = {
                init: function() {
                    var self = this;
                    self.$popup = $('<div class="b-news__popup"><div class="b-news__holder"> <div class="b-news"> <a class="b-news__close" href="#"></a> <div class="b-news__inner"> </div></div></div></div>');//$(opt.newsRead + '__popup');
                    $('body').append(self.$popup);
                    self.$popupLoad = $(opt.newsRead + opt.newsReadLoad, self.$popup);
                    self.$popupClose = $(opt.newsRead + opt.newsReadClose, self.$popup);
                    self.url = newsUrl;
                    self.$gallery = $(opt.galleryClass);
                    self.isShow = false;


                    nFeed.$feedContainer.on('click','.news-link',function(e){
                        self.loadNews($(this).data('alias'));
                        e.preventDefault();
                    });

                    self.$popupClose.click(function(e){
                        self.beforeClose();
                        e.preventDefault();
                    });

                    self.$popup.bind('click.popupNews',function(e){
                        if ($(e.target).closest($(opt.newsRead)).length) return;
                        self.beforeClose();
                        e.stopPropagation();
                    });

                    $(window).bind('app.escape',function(){
                        self.beforeClose();
                    });

                    History.Adapter.bind(window,'statechange',function(){
                        self.closePopup();
                    });

                },
                loadNews: function(alias) {
                    var self = this;
                    if (self.alias === alias) {
                        self.showPopup(true);
                        return;
                    }
                    self.alias = alias;
                    $.ajax({
                        url: self.url,
                        data: {alias: self.alias},
                        type: 'POST',
                        success: function(response){
                            self.render(response);
                        },
                        error:  function(xhr, str){
                        }
                    });
                },
                render: function(data) {
                    var self = this;
                    self.$popupLoad.html(data);
                    self.showPopup();
                },
                showPopup: function(justShow) {
                    var self = this;
                    History.pushState(null, documentTitle, historyPath + self.alias+'/');
                    $('body').addClass('is-popup-showed');
                    self.isShow = true;
                    self.$popup.fadeIn(500, function(){
                        justShow || (function(){self.afterShow()})();
                    }).scrollTop(0);
                },
                afterShow: function() {
                    var self = this;
                    self.$gallery = self.$popupLoad.find(opt.galleryClass);
                    !self.$gallery || self.$gallery.galleryPhoto(opt.galleryOpt).css('visibility','visible');
                    $('.b-news-share').sticky({topSpacing:30, scrollBlock: '.b-news__popup', getWidthFrom: '.b-news__info'});

                    self.$statSlider = self.$popupLoad.find('.career-stat-slider');
                    if ($('.career-stat-item',self.$statSlider).length > 1) {
                        self.$statSlider.find('.bx-wrapper').length || (function() {
                            var specialSlider = [
                                {
                                    sliderClass: self.$statSlider,
                                    options: {
                                        auto: false,
                                        slideWidth: 680,
                                        pager: true,
                                        onSliderLoad: function(i){
                                            this.$self.addClass('loaded');
                                            $('.career-stat-item', this.$self).eq(i).find('.stat-list').addClass('anim-start');
                                        },
                                        onSlideBefore: function($slideElement, oldIndex, newIndex) {

                                        },
                                        onSlideAfter: function($slideElement, oldIndex, newIndex) {
                                            $('.career-stat-item', this.$self).eq(newIndex).find('.stat-list').addClass('anim-start');
                                            $('.career-stat-item', this.$self).eq(oldIndex).find('.stat-list').removeClass('anim-start');
                                        }
                                    }
                                }
                            ];
                            sliderConstructor(specialSlider);
                        })();
                    } else {
                        self.$statSlider.addClass('loaded');
                        $('.career-stat-item', self.$statSlider).find('.stat-list').addClass('anim-start');
                    }
                },
                beforeClose: function() {
                    var self = this;
                    if (self.isShow) {
                        History.back();
                        self.closePopup();
                        console.log(document.title);
                    }
                    self.isShow = false;
                },
                closePopup: function() {
                    var self = this;
                    self.$popup.fadeOut(500,function(){
                        $('body').removeClass('is-popup-showed');
                    });
                }
            };

            nFeed.init();
            nFilter.init();
            nShow.init();
            if (!$self.is('.brand-news')) {
                //     nFeed.load(true);
            }
        });
    };
})(jQuery);