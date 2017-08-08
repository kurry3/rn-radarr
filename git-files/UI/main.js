webpackJsonp([0],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var RouteBinder = __webpack_require__(53);
	var SignalRBroadcaster = __webpack_require__(54);
	var NavbarLayout = __webpack_require__(58);
	var AppLayout = __webpack_require__(70);
	var MoviesController = __webpack_require__(76);
	var SeriesController = __webpack_require__(172);
	var Router = __webpack_require__(186);
	var ModalController = __webpack_require__(440);
	var ControlPanelController = __webpack_require__(483);
	var serverStatusModel = __webpack_require__(25);
	var Tooltip = __webpack_require__(484);
	var UiSettingsController = __webpack_require__(485);
	
	__webpack_require__(486);
	__webpack_require__(3);
	__webpack_require__(487);
	__webpack_require__(488);
	__webpack_require__(490);
	__webpack_require__(491);
	
	new MoviesController();
	new SeriesController();
	new ModalController();
	new ControlPanelController();
	new Router();
	
	var app = new Marionette.Application();
	
	app.addInitializer(function() {
	    console.log('starting application');
	});
	
	app.addInitializer(SignalRBroadcaster.appInitializer, { app : app });
	
	app.addInitializer(Tooltip.appInitializer, { app : app });
	
	app.addInitializer(function() {
	    Backbone.history.start({
	        pushState : true,
	        root      : serverStatusModel.get('urlBase')
	    });
	    RouteBinder.bind();
	    AppLayout.navbarRegion.show(new NavbarLayout());
	    $('body').addClass('started');
	});
	
	app.addInitializer(UiSettingsController.appInitializer);
	
	app.addInitializer(function() {
	    var footerText = serverStatusModel.get('version');
	    if (serverStatusModel.get('branch') !== 'master') {
	        footerText += '</br>' + serverStatusModel.get('branch');
	    }
	    $('#footer-region .version').html(footerText);
	});
	
	app.start();
	
	module.exports = app;


/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */,
/* 40 */,
/* 41 */,
/* 42 */,
/* 43 */,
/* 44 */,
/* 45 */,
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */,
/* 52 */,
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var $ = __webpack_require__(1);
	var StatusModel = __webpack_require__(25);
	
	//This module will automatically route all relative links through backbone router rather than
	//causing links to reload pages.
	
	var routeBinder = {
	
	    bind : function() {
	        var self = this;
	        $(document).on('click contextmenu', 'a[href]', function(event) {
	            self._handleClick(event);
	        });
	    },
	
	    _handleClick : function(event) {
	        var $target = $(event.target);
	
	        //check if tab nav
	        if ($target.parents('.nav-tabs').length) {
	            return;
	        }
	
	        var linkElement = $target.closest('a').first();
	        var href = linkElement.attr('href');
	
	        if (href && href.startsWith('http')) {
	            // Set noreferrer for external links.
	            if (!linkElement.attr('rel')) {
	                linkElement.attr('rel', 'noreferrer');
	            }
	            // Open all external links in new windows.
	            if (!linkElement.attr('target')) {
	                linkElement.attr('target', '_blank');
	            }
	        }
	
	        if (linkElement.hasClass('no-router') || event.type !== 'click') {
	            return;
	        }
	
	        if (!href) {
	            throw 'couldn\'t find route target';
	        }
	
	        if (!href.startsWith('http')) {
	            event.preventDefault();
	
	            if (event.ctrlKey) {
	                window.open(href, '_blank');
	            }
	
	            else {
	                var relativeHref = href.replace(StatusModel.get('urlBase'), '');
	
	                Backbone.history.navigate(relativeHref, { trigger : true });
	            }
	        }
	    }
	};
	
	module.exports = routeBinder;

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var $ = __webpack_require__(1);
	var Messenger = __webpack_require__(55);
	var StatusModel = __webpack_require__(25);
	__webpack_require__(40);
	
	module.exports = {
	    appInitializer : function() {
	        console.log('starting signalR');
	
	        var getStatus = function(status) {
	            switch (status) {
	                case 0:
	                    return 'connecting';
	                case 1:
	                    return 'connected';
	                case 2:
	                    return 'reconnecting';
	                case 4:
	                    return 'disconnected';
	                default:
	                    throw 'invalid status ' + status;
	            }
	        };
	
	        var tryingToReconnect = false;
	        var messengerId = 'signalR';
	
	        this.signalRconnection = $.connection(StatusModel.get('urlBase') + '/signalr');
	
	        this.signalRconnection.stateChanged(function(change) {
	            console.debug('SignalR: [{0}]'.format(getStatus(change.newState)));
	        });
	
	        this.signalRconnection.received(function(message) {
	            vent.trigger('server:' + message.name, message.body);
	        });
	
	        this.signalRconnection.reconnecting(function() {
	            if (window.NzbDrone.unloading) {
	                return;
	            }
	
	            tryingToReconnect = true;
	        });
	
	        this.signalRconnection.reconnected(function() {
	            tryingToReconnect = false;
	        });
	
	        this.signalRconnection.disconnected(function() {
	            if (tryingToReconnect) {
	                $('<div class="modal-backdrop fade in"></div>').appendTo(document.body);
	
	                Messenger.show({
	                    id        : messengerId,
	                    type      : 'error',
	                    hideAfter : 0,
	                    message   : 'Connection to backend lost',
	                    actions   : {
	                        cancel : {
	                            label  : 'Reload',
	                            action : function() {
	                                window.location.reload();
	                            }
	                        }
	                    }
	                });
	            }
	        });
	
	        this.signalRconnection.start({ transport : ['longPolling'] });
	
	        return this;
	    }
	};

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(56);
	
	var messenger = __webpack_require__(56);
	module.exports = {
	    show : function(options) {
	        if (!options.type) {
	            options.type = 'info';
	        }
	
	        if (options.hideAfter === undefined) {
	            switch (options.type) {
	                case 'info':
	                    options.hideAfter = 5;
	                    break;
	
	                case 'success':
	                    options.hideAfter = 5;
	                    break;
	
	                default:
	                    options.hideAfter = 5;
	            }
	        }
	
	        options.hideOnNavigate = options.hideOnNavigate || false;
	
	        return messenger().post({
	            message         : options.message,
	            type            : options.type,
	            showCloseButton : true,
	            hideAfter       : options.hideAfter,
	            id              : options.id,
	            actions         : options.actions,
	            hideOnNavigate  : options.hideOnNavigate
	        });
	    },
	
	    monitor : function(options) {
	        if (!options.promise) {
	            throw 'promise is required';
	        }
	
	        if (!options.successMessage) {
	            throw 'success message is required';
	        }
	
	        if (!options.errorMessage) {
	            throw 'error message is required';
	        }
	
	        var self = this;
	
	        options.promise.done(function() {
	            self.show({ message : options.successMessage });
	        });
	
	        options.promise.fail(function() {
	            self.show({
	                message : options.errorMessage,
	                type    : 'error'
	            });
	        });
	
	        return options.promise;
	    }
	};

/***/ },
/* 56 */,
/* 57 */,
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var $ = __webpack_require__(1);
	var HealthView = __webpack_require__(59);
	var QueueView = __webpack_require__(62);
	__webpack_require__(63);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Navbar/NavbarLayoutTemplate',
	
	    regions : {
	        health : '#x-health',
	        queue  : '#x-queue-count'
	    },
	
	    ui : {
	        search   : '.x-series-search',
	        collapse : '.x-navbar-collapse'
	    },
	
	    events : {
	        'click a' : 'onClick'
	    },
	
	    onRender : function() {
	        this.ui.search.bindSearch();
	        this.health.show(new HealthView());
	        this.queue.show(new QueueView());
	    },
	
	    onClick : function(event) {
	        var target = $(event.target);
	
	        //look down for <a/>
	        var href = event.target.getAttribute('href');
	
	        if (href && href.startsWith("http")) {
	            return;
	        }
	
	        event.preventDefault();
	
	        //if couldn't find it look up'
	        if (!href && target.closest('a') && target.closest('a')[0]) {
	
	            var linkElement = target.closest('a')[0];
	
	            href = linkElement.getAttribute('href');
	            this.setActive(linkElement);
	        } else {
	            this.setActive(event.target);
	        }
	
	        if ($(window).width() < 768) {
	            this.ui.collapse.collapse('hide');
	        }
	    },
	
	    setActive : function(element) {
	        //Todo: Set active on first load
	        this.$('a').removeClass('active');
	        $(element).addClass('active');
	    }
	});

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var HealthCollection = __webpack_require__(60);
	
	module.exports = Marionette.ItemView.extend({
	    tagName : 'span',
	
	    initialize : function() {
	        this.listenTo(HealthCollection, 'sync', this._healthSync);
	        HealthCollection.fetch();
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        if (HealthCollection.length === 0) {
	            return this;
	        }
	
	        var count = HealthCollection.length;
	        var label = 'label-warning';
	        var errors = HealthCollection.some(function(model) {
	            return model.get('type') === 'error';
	        });
	
	        if (errors) {
	            label = 'label-danger';
	        }
	
	        this.$el.html('<span class="label {0}">{1}</span>'.format(label, count));
	        return this;
	    },
	
	    _healthSync : function() {
	        this.render();
	    }
	});

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var HealthModel = __webpack_require__(61);
	__webpack_require__(39);
	
	var Collection = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/health',
	    model : HealthModel
	});
	
	var collection = new Collection().bindSignalR();
	collection.fetch();
	
	module.exports = collection;

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var QueueCollection = __webpack_require__(28);
	
	module.exports = Marionette.ItemView.extend({
	    tagName : 'span',
	
	    initialize : function() {
	        this.listenTo(QueueCollection, 'sync', this.render);
	        QueueCollection.fetch();
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        if (QueueCollection.length === 0) {
	            return this;
	        }
	
	        var count = QueueCollection.fullCollection.length;
	        var label = 'label-info';
	
	        var errors = QueueCollection.fullCollection.some(function(model) {
	            return model.has('trackedDownloadStatus') && model.get('trackedDownloadStatus').toLowerCase() === 'error';
	        });
	
	        var warnings = QueueCollection.fullCollection.some(function(model) {
	            return model.has('trackedDownloadStatus') && model.get('trackedDownloadStatus').toLowerCase() === 'warning';
	        });
	
	        if (errors) {
	            label = 'label-danger';
	        } else if (warnings) {
	            label = 'label-warning';
	        }
	
	        this.$el.html('<span class="label {0}">{1}</span>'.format(label, count));
	        return this;
	    }
	});

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Backbone = __webpack_require__(6);
	var SeriesCollection = __webpack_require__(64);
	__webpack_require__(67);
	
	vent.on(vent.Hotkeys.NavbarSearch, function() {
	    $('.x-series-search').focus();
	});
	
	var substringMatcher = function() {
	    return function findMatches (q, cb) {
	        var matches = _.select(SeriesCollection.toJSON(), function(series) {
	            return series.title.toLowerCase().indexOf(q.toLowerCase()) > -1;
	        });
	        cb(matches);
	    };
	};
	
	$.fn.bindSearch = function() {
	    $(this).typeahead({
	        hint      : true,
	        highlight : true,
	        minLength : 1
	    }, {
	        name       : 'series',
	        displayKey : 'title',
	        source     : substringMatcher()
	    });
	
	    $(this).on('typeahead:selected typeahead:autocompleted', function(e, series) {
	        this.blur();
	        $(this).val('');
	        Backbone.history.navigate('/movies/{0}'.format(series.titleSlug), { trigger : true });
	    });
	};


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Backbone = __webpack_require__(6);
	var PageableCollection = __webpack_require__(29);
	var MovieModel = __webpack_require__(33);
	var ApiData = __webpack_require__(23);
	var AsFilteredCollection = __webpack_require__(65);
	var AsSortedCollection = __webpack_require__(34);
	var AsPersistedStateCollection = __webpack_require__(66);
	var moment = __webpack_require__(17);
	__webpack_require__(39);
	
	var Collection = PageableCollection.extend({
	    url       : window.NzbDrone.ApiRoot + '/movie',
	    model     : MovieModel,
	    tableName : 'movie',
	
	    state : {
	        sortKey            : 'title',
	        order              : 1,
	        pageSize           : 100000,
	        secondarySortKey   : 'title',
	        secondarySortOrder : -1
	    },
	
	    mode : 'client',
	
	    save : function() {
	        var self = this;
	
	        var proxy = _.extend(new Backbone.Model(), {
	            id : '',
	
	            url : self.url + '/editor',
	
	            toJSON : function() {
	                return self.filter(function(model) {
	                    return model.edited;
	                });
	            }
	        });
	
	        this.listenTo(proxy, 'sync', function(proxyModel, models) {
	            this.add(models, { merge : true });
	            this.trigger('save', this);
	        });
	
	        return proxy.save();
	    },
	
	    filterModes : {
	        'all'        : [
	            null,
	            null
	        ],
	        'continuing' : [
	            'status',
	            'continuing'
	        ],
	        'ended'      : [
	            'status',
	            'ended'
	        ],
	        'monitored'  : [
	            'monitored',
	            true
	        ],
	        'missing'  : [
	            null,
	            null,
	            function(model) { return model.get('episodeCount') !== model.get('episodeFileCount'); }
	        ]
	    },
	
	    sortMappings : {
	        title : {
	            sortKey : 'title'
	        },
	
	        nextAiring : {
	            sortValue : function(model, attr, order) {
	                var nextAiring = model.get(attr);
	
	                if (nextAiring) {
	                    return moment(nextAiring).unix();
	                }
	
	                if (order === 1) {
	                    return 0;
	                }
	
	                return Number.MAX_VALUE;
	            }
	        },
	
	        percentOfEpisodes : {
	            sortValue : function(model, attr) {
	                var percentOfEpisodes = model.get(attr);
	                var episodeCount = model.get('episodeCount');
	
	                return percentOfEpisodes + episodeCount / 1000000;
	            }
	        },
	
	        path : {
	            sortValue : function(model) {
	                var path = model.get('path');
	
	                return path.toLowerCase();
	            }
	        }
	    }
	});
	
	Collection = AsFilteredCollection.call(Collection);
	Collection = AsSortedCollection.call(Collection);
	Collection = AsPersistedStateCollection.call(Collection);
	
	var data = ApiData.get('movie');
	
	module.exports = new Collection(data, { full : true }).bindSignalR();


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Backbone = __webpack_require__(6);
	
	module.exports = function() {
	
	    this.prototype.setFilter = function(filter, options) {
	        options = _.extend({ reset : true }, options || {});
	
	        this.state.filterKey = filter[0];
	        this.state.filterValue = filter[1];
	        this.state.filterType = filter[2] || 'equal';
	
	        if (options.reset) {
	            if (this.mode !== 'server') {
	                this.fullCollection.resetFiltered();
	            } else {
	                return this.fetch();
	            }
	        }
	    };
	
	    this.prototype.setFilterMode = function(mode, options) {
	        return this.setFilter(this.filterModes[mode], options);
	    };
	
	    var originalMakeFullCollection = this.prototype._makeFullCollection;
	
	    this.prototype._makeFullCollection = function(models, options) {
	        var self = this;
	
	        self.shadowCollection = originalMakeFullCollection.call(this, models, options);
	
	        var filterModel = function(model) {
	            if (_.isFunction(self.state.filterType)) {
	                return self.state.filterType(model);
	            }
	
	            if (!self.state.filterKey) {
	                return true;
	            }
	            else if (self.state.filterType === 'contains') {
	                return model.get(self.state.filterKey).toLowerCase().indexOf(self.state.filterValue.toLowerCase()) > -1;
	            }
	            else {
	                return model.get(self.state.filterKey) === self.state.filterValue;
	            }
	        };
	
	        self.shadowCollection.filtered = function() {
	            return this.filter(filterModel);
	        };
	
	        var filteredModels = self.shadowCollection.filtered();
	        var fullCollection = originalMakeFullCollection.call(this, filteredModels, options);
	
	        fullCollection.resetFiltered = function(options) {
	            Backbone.Collection.prototype.reset.call(this, self.shadowCollection.filtered(), options);
	        };
	
	        fullCollection.reset = function(models, options) {
	            self.shadowCollection.reset(models, options);
	            self.fullCollection.resetFiltered();
	        };
	
	        return fullCollection;
	    };
	
	    _.extend(this.prototype.state, {
	        filterKey   : null,
	        filterValue : null
	    });
	
	    _.extend(this.prototype.queryParams, {
	        filterKey   : 'filterKey',
	        filterValue : 'filterValue'
	    });
	
	    return this;
	};


/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Config = __webpack_require__(35);
	
	module.exports = function() {
	
	    var originalInit = this.prototype.initialize;
	    this.prototype.initialize = function(options) {
	
	        options = options || {};
	
	        if (options.tableName) {
	            this.tableName = options.tableName;
	        }
	
	        if (!this.tableName && !options.tableName) {
	            throw 'tableName is required';
	        }
	
	        _setInitialState.call(this);
	
	        this.on('backgrid:sort', _storeStateFromBackgrid, this);
	        this.on('drone:sort', _storeState, this);
	
	        if (originalInit) {
	            originalInit.call(this, options);
	        }
	    };
	
	    if (!this.prototype._getSortMapping) {
	        this.prototype._getSortMapping = function(key) {
	            return {
	                name    : key,
	                sortKey : key
	            };
	        };
	    }
	
	    var _setInitialState = function() {
	        var key = Config.getValue('{0}.sortKey'.format(this.tableName), this.state.sortKey);
	        var direction = Config.getValue('{0}.sortDirection'.format(this.tableName), this.state.order);
	        var order = parseInt(direction, 10);
	
	        this.state.sortKey = this._getSortMapping(key).sortKey;
	        this.state.order = order;
	    };
	
	    var _storeStateFromBackgrid = function(column, sortDirection) {
	        var order = _convertDirectionToInt(sortDirection);
	        var sortKey = this._getSortMapping(column.get('name')).sortKey;
	
	        Config.setValue('{0}.sortKey'.format(this.tableName), sortKey);
	        Config.setValue('{0}.sortDirection'.format(this.tableName), order);
	    };
	
	    var _storeState = function(sortModel, sortDirection) {
	        var order = _convertDirectionToInt(sortDirection);
	        var sortKey = this._getSortMapping(sortModel.get('name')).sortKey;
	
	        Config.setValue('{0}.sortKey'.format(this.tableName), sortKey);
	        Config.setValue('{0}.sortDirection'.format(this.tableName), order);
	    };
	
	    var _convertDirectionToInt = function(dir) {
	        if (dir === 'ascending') {
	            return '-1';
	        }
	
	        return '1';
	    };
	
	    return this;
	};


/***/ },
/* 67 */,
/* 68 */,
/* 69 */,
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ModalRegion = __webpack_require__(71);
	var ModalRegion2 = __webpack_require__(74);
	var ControlPanelRegion = __webpack_require__(75);
	
	var Layout = Marionette.Layout.extend({
	    regions : {
	        navbarRegion : '#nav-region',
	        mainRegion   : '#main-region'
	    },
	
	    initialize : function() {
	        this.addRegions({
	            modalRegion        : ModalRegion,
	            modalRegion2       : ModalRegion2,
	            controlPanelRegion : ControlPanelRegion
	        });
	    }
	});
	module.exports = new Layout({ el : 'body' });

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	var ModalRegionBase = __webpack_require__(72);
	
	var region = ModalRegionBase.extend({
	    el : '#modal-region'
	});
	
	module.exports = region;

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	__webpack_require__(73);
	var region = Marionette.Region.extend({
	    el : '#modal-region',
	
	    constructor : function() {
	        Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
	        this.on('show', this.showModal, this);
	    },
	
	    getEl : function(selector) {
	        var $el = $(selector);
	        $el.on('hidden', this.close);
	        return $el;
	    },
	
	    showModal : function() {
	        this.trigger('modal:beforeShow');
	        this.$el.addClass('modal fade');
	
	        //need tab index so close on escape works
	        //https://github.com/twitter/bootstrap/issues/4663
	        this.$el.attr('tabindex', '-1');
	        this.$el.modal({
	            show     : true,
	            keyboard : true,
	            backdrop : true
	        });
	
	        this.$el.on('hide.bs.modal', $.proxy(this._closing, this));
	        this.$el.on('hidden.bs.modal', $.proxy(this._closed, this));
	
	        this.currentView.$el.addClass('modal-dialog');
	
	        this.$el.on('shown.bs.modal', _.bind(function() {
	            this.trigger('modal:afterShow');
	            this.currentView.trigger('modal:afterShow');
	        }, this));
	    },
	
	    closeModal : function() {
	        $(this.el).modal('hide');
	        this.reset();
	    },
	
	    _closing : function() {
	        if (this.$el) {
	            this.$el.off('hide.bs.modal');
	            this.$el.off('shown.bs.modal');
	        }
	
	        this.reset();
	    },
	
	    _closed: function () {
	        if (this.$el) {
	            this.$el.off('hidden.bs.modal');
	        }
	    }
	});
	
	module.exports = region;

/***/ },
/* 73 */,
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var ModalRegionBase = __webpack_require__(72);
	
	var region = ModalRegionBase.extend({
	    el : '#modal-region2',
	
	    initialize : function () {
	        this.listenTo(this, 'modal:beforeShow', this.onBeforeShow);
	    },
	
	    onBeforeShow : function () {
	        this.$el.addClass('modal fade');
	        this.$el.attr('tabindex', '-1');
	        this.$el.css('z-index', '1060');
	
	        this.$el.on('shown.bs.modal', function() {
	            $('.modal-backdrop:last').css('z-index', 1059);
	        });
	    },
	
	    _closed : function () {
	        ModalRegionBase.prototype._closed.apply(this, arguments);
	
	        if (__webpack_require__(70).modalRegion.currentView) {
	            $('body').addClass('modal-open');
	        }
	    }
	});
	
	module.exports = region;

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var region = Marionette.Region.extend({
	    el : '#control-panel-region',
	
	    constructor : function() {
	        Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
	        this.on('show', this.showPanel, this);
	    },
	
	    getEl : function(selector) {
	        var $el = $(selector);
	
	        return $el;
	    },
	
	    showPanel : function() {
	        $('body').addClass('control-panel-visible');
	        this.$el.animate({
	            'margin-bottom' : 0,
	            'opacity'       : 1
	        }, {
	            queue    : false,
	            duration : 300
	        });
	    },
	
	    closePanel : function() {
	        $('body').removeClass('control-panel-visible');
	        this.$el.animate({
	            'margin-bottom' : -100,
	            'opacity'       : 0
	        }, {
	            queue    : false,
	            duration : 300
	        });
	        this.reset();
	    }
	});
	module.exports = region;

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneController = __webpack_require__(77);
	var AppLayout = __webpack_require__(70);
	var MoviesCollection = __webpack_require__(64);
	var MoviesIndexLayout = __webpack_require__(79);
	var MoviesDetailsLayout = __webpack_require__(114);
	var SeriesDetailsLayout = __webpack_require__(158);
	
	module.exports = NzbDroneController.extend({
	    _originalInit : NzbDroneController.prototype.initialize,
	
	    initialize : function() {
	        this.route('', this.series);
	        this.route('movies', this.series);
	        this.route('movies/:query', this.seriesDetails);
	
	        this._originalInit.apply(this, arguments);
	    },
	
	    series : function() {
	        this.setTitle('Movies');
	        this.showMainRegion(new MoviesIndexLayout());
	    },
	
	    seriesDetails : function(query) {
	        var series = MoviesCollection.where({ titleSlug : query });
	        if (series.length !== 0) {
	            var targetMovie = series[0];
	            console.log(AppLayout.mainRegion);
	
	            this.setTitle(targetMovie.get('title'));
	            //this.showNotFound();
	            //this.showMainRegion(new SeriesDetailsLayout({model : targetMovie}));
	            this.showMainRegion(new MoviesDetailsLayout({ model : targetMovie }));
	        } else {
	            this.showNotFound();
	        }
	    }
	});


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var NotFoundView = __webpack_require__(78);
	var Messenger = __webpack_require__(55);
	
	module.exports = Marionette.AppRouter.extend({
	    initialize : function() {
	        this.listenTo(vent, vent.Events.ServerUpdated, this._onServerUpdated);
	    },
	
	    showNotFound : function() {
	        this.setTitle('Not Found');
	        this.showMainRegion(new NotFoundView(this));
	    },
	
	    setTitle : function(title) {
	        title = title;
	        if (title === 'Radarr') {
	            document.title = 'Radarr';
	        } else {
	            document.title = title + ' - Radarr';
	        }
	
	        if (window.NzbDrone.Analytics && window.Piwik) {
	            try {
	                var piwik = window.Piwik.getTracker(window.location.protocol + '//piwik.nzbdrone.com/piwik.php', 1);
	                piwik.setReferrerUrl('');
	                piwik.setCustomUrl('http://local' + window.location.pathname);
	                piwik.setCustomVariable(1, 'version', window.NzbDrone.Version, 'page');
	                piwik.setCustomVariable(2, 'branch', window.NzbDrone.Branch, 'page');
	                piwik.trackPageView(title);
	            }
	            catch (e) {
	                console.error(e);
	            }
	        }
	    },
	
	    _onServerUpdated : function() {
	        var label = window.location.pathname === window.NzbDrone.UrlBase + '/system/updates' ? 'Reload' : 'View Changes';
	
	        Messenger.show({
	            message   : 'Radarr has been updated',
	            hideAfter : 0,
	            id        : 'sonarrUpdated',
	            actions   : {
	                viewChanges : {
	                    label  : label,
	                    action : function() {
	                        window.location = window.NzbDrone.UrlBase + '/system/updates';
	                    }
	                }
	            }
	        });
	
	        this.pendingUpdate = true;
	    },
	
	    showMainRegion : function(view) {
	        if (this.pendingUpdate) {
	            window.location.reload();
	        } else {
	            AppLayout.mainRegion.show(view);
	        }
	    }
	});


/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Shared/NotFoundViewTemplate'
	});

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var PosterCollectionView = __webpack_require__(83);
	var ListCollectionView = __webpack_require__(91);
	var EmptyView = __webpack_require__(93);
	var MoviesCollection = __webpack_require__(64);
	var InCinemasCell = __webpack_require__(94);
	var MovieTitleCell = __webpack_require__(97);
	var TemplatedCell = __webpack_require__(95);
	var ProfileCell = __webpack_require__(98);
	var MovieLinksCell = __webpack_require__(99);
	var MovieActionCell = __webpack_require__(100);
	var MovieStatusCell = __webpack_require__(101);
	var MovieDownloadStatusCell = __webpack_require__(102);
	var FooterView = __webpack_require__(103);
	var FooterModel = __webpack_require__(104);
	var ToolbarLayout = __webpack_require__(105);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Movies/Index/MoviesIndexLayoutTemplate',
	
	    regions : {
	        seriesRegion : '#x-series',
	        toolbar      : '#x-toolbar',
	        toolbar2     : '#x-toolbar2',
	        footer       : '#x-series-footer'
	    },
	
	    columns : [
	        {
	            name  : 'statusWeight',
	            label : '',
	            cell  : MovieStatusCell
	        },
	        {
	            name      : 'title',
	            label     : 'Title',
	            cell      : MovieTitleCell,
	            cellValue : 'this',
	        },
	        {
	            name  : 'profileId',
	            label : 'Profile',
	            cell  : ProfileCell
	        },
	        {
	            name  : 'inCinemas',
	            label : 'In Cinemas',
	            cell  : InCinemasCell
	        },
	        {
	            name      : 'this',
	            label     : 'Links',
	            cell      : MovieLinksCell,
	            className : "movie-links-cell"
	        },
	        {
	          name        : "this",
	          label       : "Status",
	          cell        : MovieDownloadStatusCell,
	        },
	        {
	            name     : 'this',
	            label    : '',
	            sortable : false,
	            cell     : MovieActionCell
	        }
	    ],
	
	    leftSideButtons : {
	        type       : 'default',
	        storeState : false,
	        collapse   : true,
	        items      : [
	            {
	                title : 'Add Movie',
	                icon  : 'icon-sonarr-add',
	                route : 'addmovies'
	            },
	            {
	                title : 'Movie Editor',
	                icon  : 'icon-sonarr-edit',
	                route : 'movieeditor'
	            },
	            {
	                title        : 'RSS Sync',
	                icon         : 'icon-sonarr-rss',
	                command      : 'rsssync',
	                errorMessage : 'RSS Sync Failed!'
	            },
	            {
	                title          : 'Update Library',
	                icon           : 'icon-sonarr-refresh',
	                command        : 'refreshmovie',
	                successMessage : 'Library was updated!',
	                errorMessage   : 'Library update failed!'
	            }
	        ]
	    },
	
	    initialize : function() {
	        this.seriesCollection = MoviesCollection.clone();
	        this.seriesCollection.shadowCollection.bindSignalR();
	
	        this.listenTo(this.seriesCollection.shadowCollection, 'sync', function(model, collection, options) {
	            this.seriesCollection.fullCollection.resetFiltered();
	            this._renderView();
	        });
	
	        this.listenTo(this.seriesCollection.shadowCollection, 'add', function(model, collection, options) {
	            this.seriesCollection.fullCollection.resetFiltered();
	            this._renderView();
	        });
	
	        this.listenTo(this.seriesCollection.shadowCollection, 'remove', function(model, collection, options) {
	            this.seriesCollection.fullCollection.resetFiltered();
	            this._renderView();
	        });
	
	        this.sortingOptions = {
	            type           : 'sorting',
	            storeState     : false,
	            viewCollection : this.seriesCollection,
	            items          : [
	                {
	                    title : 'Title',
	                    name  : 'title'
	                },
	                {
	                    title : 'Quality',
	                    name  : 'profileId'
	                },
	                {
	                    title : 'In Cinemas',
	                    name  : 'inCinemas'
	                },
	                {
	                  title : "Status",
	                  name : "status",
	                }
	            ]
	        };
	
	        this.filteringOptions = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'series.filterMode',
	            defaultAction : 'all',
	            items         : [
	                {
	                    key      : 'all',
	                    title    : '',
	                    tooltip  : 'All',
	                    icon     : 'icon-sonarr-all',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'monitored',
	                    title    : '',
	                    tooltip  : 'Monitored Only',
	                    icon     : 'icon-sonarr-monitored',
	                    callback : this._setFilter
	                }
	            ]
	        };
	
	        this.viewButtons = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'seriesViewMode',
	            defaultAction : 'listView',
	            items         : [
	                {
	                    key      : 'posterView',
	                    title    : '',
	                    tooltip  : 'Posters',
	                    icon     : 'icon-sonarr-view-poster',
	                    callback : this._showPosters
	                },
	                {
	                    key      : 'listView',
	                    title    : '',
	                    tooltip  : 'Overview List',
	                    icon     : 'icon-sonarr-view-list',
	                    callback : this._showList
	                },
	                {
	                    key      : 'tableView',
	                    title    : '',
	                    tooltip  : 'Table',
	                    icon     : 'icon-sonarr-view-table',
	                    callback : this._showTable
	                }
	            ]
	        };
	    },
	
	    onShow : function() {
	        this._showToolbar();
	        this._fetchCollection();
	    },
	
	    _showTable : function() {
	        this.currentView = new Backgrid.Grid({
	            collection : this.seriesCollection,
	            columns    : this.columns,
	            className  : 'table table-hover'
	        });
	
	        this._renderView();
	    },
	
	    _showList : function() {
	        this.currentView = new ListCollectionView({
	            collection : this.seriesCollection
	        });
	
	        this._renderView();
	    },
	
	    _showPosters : function() {
	        this.currentView = new PosterCollectionView({
	            collection : this.seriesCollection
	        });
	
	        this._renderView();
	    },
	
	    _renderView : function() {
	        if (MoviesCollection.length === 0) {
	            this.seriesRegion.show(new EmptyView());
	
	            this.toolbar.close();
	            this.toolbar2.close();
	        } else {
	            this.seriesRegion.show(this.currentView);
	
	            this._showToolbar();
	            this._showFooter();
	        }
	    },
	
	    _fetchCollection : function() {
	        this.seriesCollection.fetch();
	    },
	
	    _setFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        this.seriesCollection.setFilterMode(mode);
	    },
	
	    _showToolbar : function() {
	        if (this.toolbar.currentView) {
	            return;
	        }
	
	        this.toolbar2.show(new ToolbarLayout({
	            right   : [
	                this.filteringOptions
	            ],
	            context : this
	        }));
	
	        this.toolbar.show(new ToolbarLayout({
	            right   : [
	                this.sortingOptions,
	                this.viewButtons
	            ],
	            left    : [
	                this.leftSideButtons
	            ],
	            context : this
	        }));
	    },
	
	    _showFooter : function() {
	        var footerModel = new FooterModel();
	        var series = MoviesCollection.models.length;
	        var episodes = 0;
	        var episodeFiles = 0;
	        var announced = 0;
	        var released = 0;
	        var monitored = 0;
	
	        _.each(MoviesCollection.models, function(model) {
	            episodes += model.get('episodeCount');
	            episodeFiles += model.get('episodeFileCount');
	
	            if (model.get('status').toLowerCase() === 'released') {
	                released++;
	            } else {
	                announced++;
	            }
	
	            if (model.get('monitored')) {
	                monitored++;
	            }
	        });
	
	        footerModel.set({
	            series       : series,
	            released   : released,
	            announced    : announced,
	            monitored : monitored,
	            unmonitored  : series - monitored,
	            episodes     : episodes,
	            episodeFiles : episodeFiles
	        });
	
	        this.footer.show(new FooterView({ model : footerModel }));
	    }
	});


/***/ },
/* 80 */,
/* 81 */,
/* 82 */,
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var PosterItemView = __webpack_require__(84);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : PosterItemView,
	    itemViewContainer : '#x-series-posters',
	    template          : 'Series/Index/Posters/SeriesPostersCollectionViewTemplate'
	});

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	var SeriesIndexItemView = __webpack_require__(85);
	
	module.exports = SeriesIndexItemView.extend({
	    tagName  : 'li',
	    template : 'Movies/Index/Posters/SeriesPostersItemViewTemplate',
	
	    initialize : function() {
	        this.events['mouseenter .x-series-poster-container'] = 'posterHoverAction';
	        this.events['mouseleave .x-series-poster-container'] = 'posterHoverAction';
	
	        this.ui.controls = '.x-series-controls';
	        this.ui.title = '.x-title';
	    },
	
	    posterHoverAction : function() {
	        this.ui.controls.slideToggle();
	        this.ui.title.slideToggle();
	    }
	});


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var CommandController = __webpack_require__(86);
	
	module.exports = Marionette.ItemView.extend({
	    ui : {
	        refresh : '.x-refresh'
	    },
	
	    events : {
	        'click .x-edit'    : '_editSeries',
	        'click .x-refresh' : '_refreshSeries'
	    },
	
	    onRender : function() {
	        CommandController.bindToCommand({
	            element : this.ui.refresh,
	            command : {
	                name     : 'refreshMovie',
	                seriesId : this.model.get('id')
	            }
	        });
	    },
	
	    _editSeries : function() {
	        vent.trigger(vent.Commands.EditMovieCommand, { movie : this.model });
	    },
	
	    _refreshSeries : function() {
	        CommandController.Execute('refreshMovie', {
	            name     : 'refreshMovie',
	            movieId : this.model.id
	        });
	    }
	});


/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var CommandModel = __webpack_require__(87);
	var CommandCollection = __webpack_require__(88);
	var CommandMessengerCollectionView = __webpack_require__(89);
	var _ = __webpack_require__(8);
	var moment = __webpack_require__(17);
	var Messenger = __webpack_require__(55);
	__webpack_require__(4);
	
	CommandMessengerCollectionView.render();
	
	var singleton = function() {
	
	    return {
	
	        _lastCommand : {},
	
	        Execute : function(name, properties) {
	
	            var attr = _.extend({ name : name.toLocaleLowerCase() }, properties);
	            var commandModel = new CommandModel(attr);
	
	            if (this._lastCommand.command && this._lastCommand.command.isSameCommand(attr) && moment().add('seconds', -5).isBefore(this._lastCommand.time)) {
	
	                Messenger.show({
	                    message   : 'Please wait at least 5 seconds before running this command again',
	                    hideAfter : 5,
	                    type      : 'error'
	                });
	
	                return this._lastCommand.promise;
	            }
	
	            var promise = commandModel.save().success(function() {
	                CommandCollection.add(commandModel);
	            });
	
	            this._lastCommand = {
	                command : commandModel,
	                promise : promise,
	                time    : moment()
	            };
	
	            return promise;
	        },
	
	        bindToCommand : function(options) {
	
	            var self = this;
	            var existingCommand = CommandCollection.findCommand(options.command);
	
	            if (existingCommand) {
	                this._bindToCommandModel.call(this, existingCommand, options);
	            }
	
	            CommandCollection.bind('add', function(model) {
	                if (model.isSameCommand(options.command)) {
	                    self._bindToCommandModel.call(self, model, options);
	                }
	            });
	
	            CommandCollection.bind('sync', function() {
	                var command = CommandCollection.findCommand(options.command);
	                if (command) {
	                    self._bindToCommandModel.call(self, command, options);
	                }
	            });
	        },
	
	        _bindToCommandModel : function bindToCommand (model, options) {
	
	            if (!model.isActive()) {
	                options.element.stopSpin();
	                return;
	            }
	
	            model.bind('change:status', function(model) {
	                if (!model.isActive()) {
	                    options.element.stopSpin();
	
	                    if (model.isComplete()) {
	                        vent.trigger(vent.Events.CommandComplete, {
	                            command : model,
	                            model   : options.model
	                        });
	                    }
	                }
	            });
	            console.warn(options)
	            options.element.startSpin();
	        }
	    };
	};
	module.exports = singleton();


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({
	    url : window.NzbDrone.ApiRoot + '/command',
	
	    parse : function(response) {
	        response.name = response.name.toLocaleLowerCase();
	        response.body.name = response.body.name.toLocaleLowerCase();
	
	        for (var key in response.body) {
	            response[key] = response.body[key];
	        }
	
	        delete response.body;
	
	        return response;
	    },
	
	    isSameCommand : function(command) {
	
	        if (command.name.toLocaleLowerCase() !== this.get('name').toLocaleLowerCase()) {
	            return false;
	        }
	
	        for (var key in command) {
	            if (key !== 'name') {
	                if (Array.isArray(command[key])) {
	                    if (_.difference(command[key], this.get(key)).length > 0) {
	                        return false;
	                    }
	                }
	
	                else if (command[key] !== this.get(key)) {
	                    return false;
	                }
	            }
	        }
	
	        return true;
	    },
	
	    isActive : function() {
	        return this.get('status') !== 'completed' && this.get('status') !== 'failed';
	    },
	
	    isComplete : function() {
	        return this.get('status') === 'completed';
	    }
	});

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var CommandModel = __webpack_require__(87);
	__webpack_require__(39);
	
	var CommandCollection = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/command',
	    model : CommandModel,
	
	    findCommand : function(command) {
	        return this.find(function(model) {
	            return model.isSameCommand(command);
	        });
	    }
	});
	
	var collection = new CommandCollection().bindSignalR();
	
	collection.fetch();
	
	module.exports = collection;

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var commandCollection = __webpack_require__(88);
	var CommandMessengerItemView = __webpack_require__(90);
	
	var CollectionView = Marionette.CollectionView.extend({
	    itemView : CommandMessengerItemView
	});
	
	module.exports = new CollectionView({
	    collection : commandCollection
	});


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Messenger = __webpack_require__(55);
	
	module.exports = Marionette.ItemView.extend({
	    initialize : function() {
	        this.listenTo(this.model, 'change', this.render);
	    },
	
	    render : function() {
	        if (!this.model.get('message') || !this.model.get('sendUpdatesToClient')) {
	            return;
	        }
	
	        var message = {
	            type      : 'info',
	            message   : '[{0}] {1}'.format(this.model.get('name'), this.model.get('message')),
	            id        : this.model.id,
	            hideAfter : 0
	        };
	
	        var isManual = this.model.get('manual');
	
	        switch (this.model.get('state')) {
	            case 'completed':
	                message.hideAfter = 4;
	                break;
	            case 'failed':
	                message.hideAfter = isManual ? 10 : 4;
	                message.type = 'error';
	                break;
	            default :
	                message.hideAfter = 0;
	        }
	
	        if (this.messenger) {
	            this.messenger.update(message);
	        }
	
	        else {
	            this.messenger = Messenger.show(message);
	        }
	
	        console.log(message.message);
	    }
	});

/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ListItemView = __webpack_require__(92);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : ListItemView,
	    itemViewContainer : '#x-series-list',
	    template          : 'Movies/Index/Overview/SeriesOverviewCollectionViewTemplate'
	});

/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var SeriesIndexItemView = __webpack_require__(85);
	
	module.exports = SeriesIndexItemView.extend({
	    template : 'Movies/Index/Overview/SeriesOverviewItemViewTemplate'
	});


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'Movies/Index/EmptyTemplate'
	});

/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	var TemplatedCell = __webpack_require__(95);
	
	module.exports = TemplatedCell.extend({
	    className : 'in-cinemas-cell',
	
	    render : function() {
	      var monthNames = ["January", "February", "March", "April", "May", "June",
	      "July", "August", "September", "October", "November", "December"
	    ];
	      var cinemasDate = new Date(this.model.get("inCinemas"));
	      var year = cinemasDate.getFullYear();
	      var month = monthNames[cinemasDate.getMonth()];
	        this.$el.html(month + " " + year); //Hack, but somehow handlebar helper does not work.
	        return this;
	    }
	});


/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    render : function() {
	
	        var templateName = this.column.get('template') || this.template;
	
	        this.templateFunction = Marionette.TemplateCache.get(templateName);
	        this.$el.empty();
	
	        if (this.cellValue) {
	            var data = this.cellValue.toJSON();
	            var html = this.templateFunction(data);
	            this.$el.html(html);
	        }
	
	        this.delegateEvents();
	        return this;
	    }
	});


/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	var Backbone = __webpack_require__(6);
	
	module.exports = Backgrid.Cell.extend({
	
	    _originalInit : Backgrid.Cell.prototype.initialize,
	
	    initialize : function() {
	        this._originalInit.apply(this, arguments);
	        this.cellValue = this._getValue();
	
	        this.listenTo(this.model, 'change', this._refresh);
	
	        if (this._onEdit) {
	            this.listenTo(this.model, 'backgrid:edit', function(model, column, cell, editor) {
	                if (column.get('name') === this.column.get('name')) {
	                    this._onEdit(model, column, cell, editor);
	                }
	            });
	        }
	    },
	
	    _refresh : function() {
	        this.cellValue = this._getValue();
	        this.render();
	    },
	
	    _getValue : function() {
	
	        var cellValue = this.column.get('cellValue');
	
	        if (cellValue) {
	            if (cellValue === 'this') {
	                return this.model;
	            }
	
	            else {
	                return this.model.get(cellValue);
	            }
	        }
	
	        var name = this.column.get('name');
	
	        if (name === 'this') {
	            return this.model;
	        }
	
	        var value = this.model.get(name);
	
	        if (!value) {
	            return undefined;
	        }
	
	        //if not a model
	        if (!value.get && typeof value === 'object') {
	            value = new Backbone.Model(value);
	        }
	
	        return value;
	    }
	});

/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var TemplatedCell = __webpack_require__(95);
	
	module.exports = TemplatedCell.extend({
	    className : 'series-title-cell',
	    template  : 'Cells/SeriesTitleTemplate',
	
	});


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	var ProfileCollection = __webpack_require__(44);
	var _ = __webpack_require__(8);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'profile-cell',
	
	    _originalInit : Backgrid.Cell.prototype.initialize,
	
	    initialize : function () {
	        this._originalInit.apply(this, arguments);
	
	        this.listenTo(ProfileCollection, 'sync', this.render);
	    },
	
	    render : function() {
	
	        this.$el.empty();
	        var profileId = this.model.get(this.column.get('name'));
	
	        var profile = _.findWhere(ProfileCollection.models, { id : profileId });
	
	        if (profile) {
	            this.$el.html(profile.get('name'));
	        }
	
	        return this;
	    }
	});

/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	var TemplatedCell = __webpack_require__(95);
	
	module.exports = TemplatedCell.extend({
	    className : 'movie-links-cell',
	    template  : 'Cells/MovieLinksTemplate'
	});


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	var CommandController = __webpack_require__(86);
	
	module.exports = NzbDroneCell.extend({
	    className : 'series-actions-cell',
	
	    ui : {
	        refresh : '.x-refresh'
	    },
	
	    events : {
	        'click .x-edit'    : '_editSeries',
	        'click .x-refresh' : '_refreshSeries'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        this.$el.html('<i class="icon-sonarr-refresh x-refresh hidden-xs" title="" data-original-title="Update movie info and scan disk"></i> ' +
	                      '<i class="icon-sonarr-edit x-edit" title="" data-original-title="Edit Movie"></i>');
	
	        CommandController.bindToCommand({
	            element : this.$el.find('.x-refresh'),
	            command : {
	                name     : 'refreshMovie',
	                movieId : this.model.get('id')
	            }
	        });
	
	        this.delegateEvents();
	        return this;
	    },
	
	    _editSeries : function() {
	        vent.trigger(vent.Commands.EditMovieCommand, { movie : this.model });
	    },
	
	    _refreshSeries : function() {
	        CommandController.Execute('refreshMovie', {
	            name     : 'refreshMovie',
	            movieId : this.model.id
	        });
	    }
	});


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'movie-status-cell',
	
	    render : function() {
	        this.$el.empty();
	        var monitored = this.model.get('monitored');
	        var status = this.model.get('status');
	        var inCinemas = this.model.get("inCinemas");
	        var date = new Date(inCinemas);
	        var timeSince = new Date().getTime() - date.getTime();
	        var numOfMonths = timeSince / 1000 / 60 / 60 / 24 / 30;
	
	        if (status === 'released') {
	            this.$el.html('<i class="icon-sonarr-movie-released grid-icon" title="Released"></i>');
	            this._setStatusWeight(3);
	        }
	
	        if (numOfMonths > 3) {
	          this.$el.html('<i class="icon-sonarr-movie-released grid-icon" title="Released"></i>');//TODO: Update for PreDB.me
	          this._setStatusWeight(2);
	        }
	
	        if (numOfMonths < 3) {
	          this.$el.html('<i class="icon-sonarr-movie-cinemas grid-icon" title="In Cinemas"></i>');
	          this._setStatusWeight(2);
	        }
	
	        if (status === "announced") {
	          this.$el.html('<i class="icon-sonarr-movie-announced grid-icon" title="Announced"></i>');
	          this._setStatusWeight(1);
	        }
	
	        else if (!monitored) {
	            this.$el.html('<i class="icon-sonarr-series-unmonitored grid-icon" title="Not Monitored"></i>');
	            this._setStatusWeight(0);
	        }
	        
	        return this;
	    },
	
	    _setStatusWeight : function(weight) {
	        this.model.set('statusWeight', weight, { silent : true });
	    }
	});


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	var TemplatedCell = __webpack_require__(95);
	
	module.exports = TemplatedCell.extend({
	    className : 'movie-title-cell',
	    template  : 'Cells/MovieDownloadStatusTemplate',
	});


/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'Movies/Index/FooterViewTemplate'
	});

/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var _ = __webpack_require__(8);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ButtonCollection = __webpack_require__(106);
	var ButtonModel = __webpack_require__(107);
	var RadioButtonCollectionView = __webpack_require__(108);
	var ButtonCollectionView = __webpack_require__(110);
	var SortingButtonCollectionView = __webpack_require__(112);
	var _ = __webpack_require__(8);
	
	module.exports = Marionette.Layout.extend({
	    template  : 'Shared/Toolbar/ToolbarLayoutTemplate',
	    className : 'toolbar',
	
	    ui : {
	        left_x  : '.x-toolbar-left',
	        right_x : '.x-toolbar-right'
	    },
	
	    initialize : function(options) {
	        if (!options) {
	            throw 'options needs to be passed';
	        }
	
	        if (!options.context) {
	            throw 'context needs to be passed';
	        }
	
	        this.templateHelpers = {
	            floatOnMobile : options.floatOnMobile || false
	        };
	
	        this.left = options.left;
	        this.right = options.right;
	        this.toolbarContext = options.context;
	    },
	
	    onShow : function() {
	        if (this.left) {
	            _.each(this.left, this._showToolbarLeft, this);
	        }
	        if (this.right) {
	            _.each(this.right, this._showToolbarRight, this);
	        }
	    },
	
	    _showToolbarLeft : function(element, index) {
	        this._showToolbar(element, index, 'left');
	    },
	
	    _showToolbarRight : function(element, index) {
	        this._showToolbar(element, index, 'right');
	    },
	
	    _showToolbar : function(buttonGroup, index, position) {
	        var groupCollection = new ButtonCollection();
	
	        _.each(buttonGroup.items, function(button) {
	            if (buttonGroup.storeState && !button.key) {
	                throw 'must provide key for all buttons when storeState is enabled';
	            }
	
	            var model = new ButtonModel(button);
	            model.set('menuKey', buttonGroup.menuKey);
	            model.ownerContext = this.toolbarContext;
	            groupCollection.add(model);
	        }, this);
	
	        var buttonGroupView;
	
	        switch (buttonGroup.type) {
	            case 'radio':
	            {
	                buttonGroupView = new RadioButtonCollectionView({
	                    collection : groupCollection,
	                    menu       : buttonGroup
	                });
	                break;
	            }
	            case 'sorting':
	            {
	                buttonGroupView = new SortingButtonCollectionView({
	                    collection     : groupCollection,
	                    menu           : buttonGroup,
	                    viewCollection : buttonGroup.viewCollection
	                });
	                break;
	            }
	            default:
	            {
	                buttonGroupView = new ButtonCollectionView({
	                    collection : groupCollection,
	                    menu       : buttonGroup
	                });
	                break;
	            }
	        }
	
	        var regionId = position + '_' + (index + 1);
	        var region = this[regionId];
	
	        if (!region) {
	            var regionClassName = 'x-toolbar-' + position + '-' + (index + 1);
	            this.ui[position + '_x'].append('<div class="toolbar-group ' + regionClassName + '" />\r\n');
	            region = this.addRegion(regionId, '.' + regionClassName);
	        }
	
	        region.show(buttonGroupView);
	    }
	});

/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var ButtonModel = __webpack_require__(107);
	
	module.exports = Backbone.Collection.extend({
	    model : ButtonModel
	});

/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({
	    defaults : {
	        'target'  : '/nzbdrone/route',
	        'title'   : '',
	        'active'  : false,
	        'tooltip' : undefined
	    }
	});

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var RadioButtonView = __webpack_require__(109);
	var Config = __webpack_require__(35);
	
	module.exports = Marionette.CollectionView.extend({
	    className : 'btn-group',
	    itemView  : RadioButtonView,
	
	    attributes : {
	        'data-toggle' : 'buttons'
	    },
	
	    initialize : function(options) {
	        this.menu = options.menu;
	
	        this.setActive();
	    },
	
	    setActive : function() {
	        var storedKey = this.menu.defaultAction;
	
	        if (this.menu.storeState) {
	            storedKey = Config.getValue(this.menu.menuKey, storedKey);
	        }
	
	        if (!storedKey) {
	            return;
	        }
	        this.collection.each(function(model) {
	            if (model.get('key').toLocaleLowerCase() === storedKey.toLowerCase()) {
	                model.set('active', true);
	            } else {
	                model.set('active, false');
	            }
	        });
	    }
	});

/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Config = __webpack_require__(35);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Shared/Toolbar/RadioButtonTemplate',
	    className : 'btn btn-default',
	
	    ui : {
	        icon : 'i'
	    },
	
	    events : {
	        'click' : 'onClick'
	    },
	
	    initialize : function() {
	        this.storageKey = this.model.get('menuKey') + ':' + this.model.get('key');
	    },
	
	    onRender : function() {
	        if (this.model.get('active')) {
	            this.$el.addClass('active');
	            this.invokeCallback();
	        }
	
	        if (!this.model.get('title')) {
	            this.$el.addClass('btn-icon-only');
	        }
	
	        if (this.model.get('tooltip')) {
	            this.$el.attr('title', this.model.get('tooltip'));
	        }
	    },
	
	    onClick : function() {
	        Config.setValue(this.model.get('menuKey'), this.model.get('key'));
	        this.invokeCallback();
	    },
	
	    invokeCallback : function() {
	        if (!this.model.ownerContext) {
	            throw 'ownerContext must be set.';
	        }
	
	        var callback = this.model.get('callback');
	        if (callback) {
	            callback.call(this.model.ownerContext, this);
	        }
	    }
	});

/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ButtonView = __webpack_require__(111);
	
	module.exports = Marionette.CollectionView.extend({
	    className : 'btn-group',
	    itemView  : ButtonView,
	
	    initialize : function(options) {
	        this.menu = options.menu;
	        this.className = 'btn-group';
	
	        if (options.menu.collapse) {
	            this.className += ' btn-group-collapse';
	        }
	    },
	
	    onRender : function() {
	        if (this.menu.collapse) {
	            this.$el.addClass('btn-group-collapse');
	        }
	    }
	});

/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var _ = __webpack_require__(8);
	var CommandController = __webpack_require__(86);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Shared/Toolbar/ButtonTemplate',
	    className : 'btn btn-default btn-icon-only-xs',
	
	    ui : {
	        icon : 'i'
	    },
	
	    events : {
	        'click' : 'onClick'
	    },
	
	    initialize : function() {
	        this.storageKey = this.model.get('menuKey') + ':' + this.model.get('key');
	    },
	
	    onRender : function() {
	        if (this.model.get('active')) {
	            this.$el.addClass('active');
	            this.invokeCallback();
	        }
	
	        if (!this.model.get('title')) {
	            this.$el.addClass('btn-icon-only');
	        }
	
	        if (this.model.get('className')) {
	            this.$el.addClass(this.model.get('className'));
	        }
	
	        if (this.model.get('tooltip')) {
	            this.$el.attr('title', this.model.get('tooltip'));
	        }
	
	        var command = this.model.get('command');
	        if (command) {
	            var properties = _.extend({ name : command }, this.model.get('properties'));
	
	            CommandController.bindToCommand({
	                command : properties,
	                element : this.$el
	            });
	        }
	    },
	
	    onClick : function() {
	        if (this.$el.hasClass('disabled')) {
	            return;
	        }
	
	        this.invokeCallback();
	        this.invokeRoute();
	        this.invokeCommand();
	    },
	
	    invokeCommand : function() {
	        var command = this.model.get('command');
	        if (command) {
	            CommandController.Execute(command, this.model.get('properties'));
	        }
	    },
	
	    invokeRoute : function() {
	        var route = this.model.get('route');
	        if (route) {
	            Backbone.history.navigate(route, { trigger : true });
	        }
	    },
	
	    invokeCallback : function() {
	        if (!this.model.ownerContext) {
	            throw 'ownerContext must be set.';
	        }
	
	        var callback = this.model.get('callback');
	        if (callback) {
	            callback.call(this.model.ownerContext, this);
	        }
	    }
	});

/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	var PageableCollection = __webpack_require__(29);
	var Marionette = __webpack_require__(11);
	var ButtonView = __webpack_require__(113);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : ButtonView,
	    template          : 'Shared/Toolbar/Sorting/SortingButtonCollectionViewTemplate',
	    itemViewContainer : '.dropdown-menu',
	
	    initialize : function(options) {
	        this.viewCollection = options.viewCollection;
	        this.listenTo(this.viewCollection, 'drone:sort', this.sort);
	    },
	
	    itemViewOptions : function() {
	        return {
	            viewCollection : this.viewCollection
	        };
	    },
	
	    sort : function(sortModel, sortDirection) {
	        var collection = this.viewCollection;
	
	        var order;
	        if (sortDirection === 'ascending') {
	            order = -1;
	        } else if (sortDirection === 'descending') {
	            order = 1;
	        } else {
	            order = null;
	        }
	
	        collection.setSorting(sortModel.get('name'), order);
	        collection.fullCollection.sort();
	
	        return this;
	    }
	});

/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var _ = __webpack_require__(8);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Shared/Toolbar/Sorting/SortingButtonViewTemplate',
	    tagName  : 'li',
	
	    ui : {
	        icon : 'i'
	    },
	
	    events : {
	        'click' : 'onClick'
	    },
	
	    initialize : function(options) {
	        this.viewCollection = options.viewCollection;
	        this.listenTo(this.viewCollection, 'drone:sort', this.render);
	        this.listenTo(this.viewCollection, 'backgrid:sort', this.render);
	    },
	
	    onRender : function() {
	        if (this.viewCollection.state) {
	            var sortKey = this.viewCollection.state.sortKey;
	            var name = this.viewCollection._getSortMapping(sortKey).name;
	            var order = this.viewCollection.state.order;
	
	            if (name === this.model.get('name')) {
	                this._setSortIcon(order);
	            } else {
	                this._removeSortIcon();
	            }
	        }
	    },
	
	    onClick : function(e) {
	        e.preventDefault();
	
	        var collection = this.viewCollection;
	        var event = 'drone:sort';
	
	        var direction = collection.state.order;
	        if (direction === 'ascending' || direction === -1) {
	            direction = 'descending';
	        } else {
	            direction = 'ascending';
	        }
	
	        collection.setSorting(this.model.get('name'), direction);
	        collection.trigger(event, this.model, direction);
	    },
	
	    _convertDirectionToIcon : function(dir) {
	        if (dir === 'ascending' || dir === -1) {
	            return 'icon-sonarr-sort-asc';
	        }
	
	        return 'icon-sonarr-sort-desc';
	    },
	
	    _setSortIcon : function(dir) {
	        this._removeSortIcon();
	        this.ui.icon.addClass(this._convertDirectionToIcon(dir));
	    },
	
	    _removeSortIcon : function() {
	        this.ui.icon.removeClass('icon-sonarr-sort-asc icon-sonarr-sort-desc');
	    }
	});


/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var reqres = __webpack_require__(115);
	var Marionette = __webpack_require__(11);
	var Backbone = __webpack_require__(6);
	var MoviesCollection = __webpack_require__(64);
	var InfoView = __webpack_require__(116);
	var CommandController = __webpack_require__(86);
	var LoadingView = __webpack_require__(117);
	var EpisodeFileEditorLayout = __webpack_require__(118);
	var HistoryLayout = __webpack_require__(132);
	var SearchLayout = __webpack_require__(143);
	__webpack_require__(157);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    itemViewContainer : '.x-movie-seasons',
	    template          : 'Movies/Details/MoviesDetailsTemplate',
	
	    regions : {
	        seasons : '#seasons',
	        info    : '#info',
	        search  : '#movie-search',
	        history : '#movie-history'
	    },
	
	
	    ui : {
	        header    : '.x-header',
	        monitored : '.x-monitored',
	        edit      : '.x-edit',
	        refresh   : '.x-refresh',
	        rename    : '.x-rename',
	        searchAuto    : '.x-search',
	        poster    : '.x-movie-poster',
	        manualSearch : '.x-manual-search',
	        history   : '.x-movie-history',
	        search    : '.x-movie-search'
	    },
	
	    events : {
	        'click .x-episode-file-editor' : '_openEpisodeFileEditor',
	        'click .x-monitored'           : '_toggleMonitored',
	        'click .x-edit'                : '_editMovie',
	        'click .x-refresh'             : '_refreshMovies',
	        'click .x-rename'              : '_renameMovies',
	        'click .x-search'              : '_moviesSearch',
	        'click .x-manual-search'       : '_showSearch',
	        'click .x-movie-history'     : '_showHistory',
	        'click .x-movie-search'      : '_showSearch'
	    },
	
	    initialize : function() {
	        this.moviesCollection = MoviesCollection.clone();
	        this.moviesCollection.shadowCollection.bindSignalR();
	
	        this.listenTo(this.model, 'change:monitored', this._setMonitoredState);
	        this.listenTo(this.model, 'remove', this._moviesRemoved);
	        this.listenTo(vent, vent.Events.CommandComplete, this._commandComplete);
	
	        this.listenTo(this.model, 'change', function(model, options) {
	            if (options && options.changeSource === 'signalr') {
	                this._refresh();
	            }
	        });
	
	        this.listenTo(this.model,  'change:images', this._updateImages);
	    },
	
	    onShow : function() {
	        this.searchLayout = new SearchLayout({ model : this.model });
	        this.searchLayout.startManualSearch = true;
	
	        this._showBackdrop();
	        this._showSeasons();
	        this._setMonitoredState();
	        this._showInfo();
	        this._showHistory();
	    },
	
	    onRender : function() {
	        CommandController.bindToCommand({
	            element : this.ui.refresh,
	            command : {
	                name : 'refreshMovie'
	            }
	        });
	
	        CommandController.bindToCommand({
	            element : this.ui.searchAuto,
	            command : {
	                name : 'moviesSearch'
	            }
	        });
	
	        CommandController.bindToCommand({
	            element : this.ui.rename,
	            command : {
	                name         : 'renameMovieFiles',
	                movieId     : this.model.id,
	                seasonNumber : -1
	            }
	        });
	    },
	
	    onClose : function() {
	        if (this._backstrech) {
	            this._backstrech.destroy();
	            delete this._backstrech;
	        }
	
	        $('body').removeClass('backdrop');
	        reqres.removeHandler(reqres.Requests.GetEpisodeFileById);
	    },
	
	    _getImage : function(type) {
	        var image = _.where(this.model.get('images'), { coverType : type });
	
	        if (image && image[0]) {
	            return image[0].url;
	        }
	
	        return undefined;
	    },
	
	    _showHistory : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.history.tab('show');
	        this.history.show(new HistoryLayout({
	            model  : this.model
	        }));
	    },
	
	    _showSearch : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.search.tab('show');
	        this.search.show(this.searchLayout);
	    },
	
	    _toggleMonitored : function() {
	        var savePromise = this.model.save('monitored', !this.model.get('monitored'), { wait : true });
	
	        this.ui.monitored.spinForPromise(savePromise);
	    },
	
	    _setMonitoredState : function() {
	        var monitored = this.model.get('monitored');
	
	        this.ui.monitored.removeAttr('data-idle-icon');
	        this.ui.monitored.removeClass('fa-spin icon-sonarr-spinner');
	
	        if (monitored) {
	            this.ui.monitored.addClass('icon-sonarr-monitored');
	            this.ui.monitored.removeClass('icon-sonarr-unmonitored');
	            this.$el.removeClass('movie-not-monitored');
	        } else {
	            this.ui.monitored.addClass('icon-sonarr-unmonitored');
	            this.ui.monitored.removeClass('icon-sonarr-monitored');
	            this.$el.addClass('movie-not-monitored');
	        }
	    },
	
	    _editMovie : function() {
	        vent.trigger(vent.Commands.EditMovieCommand, { movie : this.model });
	    },
	
	    _refreshMovies : function() {
	        CommandController.Execute('refreshMovie', {
	            name     : 'refreshMovie',
	            movieId : this.model.id
	        });
	    },
	
	    _moviesRemoved : function() {
	        Backbone.history.navigate('/', { trigger : true });
	    },
	
	    _renameMovies : function() {
	        vent.trigger(vent.Commands.ShowRenamePreview, { movie : this.model });
	    },
	
	    _moviesSearch : function() {
	        CommandController.Execute('moviesSearch', {
	            name     : 'moviesSearch',
	            movieId : this.model.id
	        });
	    },
	
	    _showSeasons : function() {
	        var self = this;
	
	        return;
	
	        reqres.setHandler(reqres.Requests.GetEpisodeFileById, function(episodeFileId) {
	            return self.episodeFileCollection.get(episodeFileId);
	        });
	
	        reqres.setHandler(reqres.Requests.GetAlternateNameBySeasonNumber, function(moviesId, seasonNumber, sceneSeasonNumber) {
	            if (self.model.get('id') !== moviesId) {
	                return [];
	            }
	
	            if (sceneSeasonNumber === undefined) {
	                sceneSeasonNumber = seasonNumber;
	            }
	
	            return _.where(self.model.get('alternateTitles'),
	                function(alt) {
	                    return alt.sceneSeasonNumber === sceneSeasonNumber || alt.seasonNumber === seasonNumber;
	                });
	        });
	
	        $.when(this.episodeCollection.fetch(), this.episodeFileCollection.fetch()).done(function() {
	            var seasonCollectionView = new SeasonCollectionView({
	                collection        : self.seasonCollection,
	                episodeCollection : self.episodeCollection,
	                movies            : self.model
	            });
	
	            if (!self.isClosed) {
	                self.seasons.show(seasonCollectionView);
	            }
	        });
	    },
	
	    _showInfo : function() {
	        this.info.show(new InfoView({
	            model                 : this.model
	        }));
	    },
	
	    _commandComplete : function(options) {
	        if (options.command.get('name') === 'renameMoviefiles') {
	            if (options.command.get('moviesId') === this.model.get('id')) {
	                this._refresh();
	            }
	        }
	    },
	
	    _refresh : function() {
	        //this.seasonCollection.add(this.model.get('seasons'), { merge : true });
	        //this.episodeCollection.fetch();
	        //this.episodeFileCollection.fetch();
	
	        this._setMonitoredState();
	        this._showInfo();
	    },
	
	    _openEpisodeFileEditor : function() {
	        var view = new EpisodeFileEditorLayout({
	            movies            : this.model,
	            episodeCollection : this.episodeCollection
	        });
	
	        vent.trigger(vent.Commands.OpenModalCommand, view);
	    },
	
	    _updateImages : function () {
	        var poster = this._getImage('poster');
	
	        if (poster) {
	            this.ui.poster.attr('src', poster);
	        }
	
	        this._showBackdrop();
	    },
	
	    _showBackdrop : function () {
	        $('body').addClass('backdrop');
	        var fanArt = this._getImage('banner');
	
	        if (fanArt) {
	            this._backstrech = $.backstretch(fanArt);
	        } else {
	            $('body').removeClass('backdrop');
	        }
	    },
	
	    _manualSearchM : function() {
	        console.warn("Manual Search started");
	        console.warn(this.model.id);
	        console.warn(this.model)
	        console.warn(this.episodeCollection);
	        vent.trigger(vent.Commands.ShowEpisodeDetails, {
	            episode        : this.model,
	            hideMoviesLink : true,
	            openingTab     : 'search'
	        });
	    }
	});


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	var Wreqr = __webpack_require__(37);
	
	var reqres = new Wreqr.RequestResponse();
	
	reqres.Requests = {
	    GetEpisodeFileById                  : 'GetEpisodeFileById',
	    GetAlternateNameBySeasonNumber      : 'GetAlternateNameBySeasonNumber'
	};
	
	module.exports = reqres;

/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Movies/Details/InfoViewTemplate',
	
	    initialize : function(options) {
	        //this.episodeFileCollection = options.episodeFileCollection;
	
	        this.listenTo(this.model, 'change', this.render);
	        //this.listenTo(this.episodeFileCollection, 'sync', this.render); TODO: Update this;
	    },
	
	    templateHelpers : function() {
	        return {
	            fileCount : 0
	        };
	    }
	});


/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Shared/LoadingViewTemplate',
	    className : 'nz-loading row'
	});

/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var reqres = __webpack_require__(115);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var FormatHelpers = __webpack_require__(20);
	var SelectAllCell = __webpack_require__(119);
	var EpisodeNumberCell = __webpack_require__(122);
	var SeasonEpisodeNumberCell = __webpack_require__(124);
	var EpisodeFilePathCell = __webpack_require__(125);
	var EpisodeStatusCell = __webpack_require__(126);
	var RelativeDateCell = __webpack_require__(127);
	var EpisodeCollection = __webpack_require__(128);
	var ProfileSchemaCollection = __webpack_require__(129);
	var QualitySelectView = __webpack_require__(130);
	var EmptyView = __webpack_require__(131);
	
	module.exports = Marionette.Layout.extend({
	    className : 'modal-lg',
	    template  : 'EpisodeFile/Editor/EpisodeFileEditorLayoutTemplate',
	
	    regions : {
	        episodeGrid : '.x-episode-list',
	        quality     : '.x-quality'
	    },
	
	    ui : {
	        seasonMonitored : '.x-season-monitored'
	    },
	
	    events : {
	        'click .x-season-monitored' : '_seasonMonitored',
	        'click .x-delete-files'     : '_deleteFiles'
	    },
	
	    initialize : function(options) {
	        if (!options.series) {
	            throw 'series is required';
	        }
	
	        if (!options.episodeCollection) {
	            throw 'episodeCollection is required';
	        }
	
	        var filtered = options.episodeCollection.filter(function(episode) {
	            return episode.get('episodeFileId') > 0;
	        });
	
	        this.series = options.series;
	        this.episodeCollection = options.episodeCollection;
	        this.filteredEpisodes = new EpisodeCollection(filtered);
	
	        this.templateHelpers = {};
	        this.templateHelpers.series = this.series.toJSON();
	
	        this._getColumns();
	    },
	
	    onRender : function() {
	        this._getQualities();
	        this._showEpisodes();
	    },
	
	    _getColumns : function () {
	        var episodeCell = {};
	
	        if (this.model) {
	            episodeCell.name = 'episodeNumber';
	            episodeCell.label = '#';
	            episodeCell.cell = EpisodeNumberCell;
	        }
	
	        else {
	            episodeCell.name = 'seasonEpisode';
	            episodeCell.cellValue = 'this';
	            episodeCell.label = 'Episode';
	            episodeCell.cell = SeasonEpisodeNumberCell;
	            episodeCell.sortValue = this._seasonEpisodeSorter;
	        }
	
	        this.columns = [
	            {
	                name       : '',
	                cell       : SelectAllCell,
	                headerCell : 'select-all',
	                sortable   : false
	            },
	            episodeCell,
	            {
	                name     : 'episodeNumber',
	                label    : 'Relative Path',
	                cell     : EpisodeFilePathCell,
	                sortable : false
	            },
	            {
	                name  : 'airDateUtc',
	                label : 'Air Date',
	                cell  : RelativeDateCell
	            },
	            {
	                name     : 'status',
	                label    : 'Quality',
	                cell     : EpisodeStatusCell,
	                sortable : false
	            }
	        ];
	    },
	
	    _showEpisodes : function() {
	        if (this.filteredEpisodes.length === 0) {
	            this.episodeGrid.show(new EmptyView());
	            return;
	        }
	
	        this._setInitialSort();
	
	        this.episodeGridView = new Backgrid.Grid({
	            columns    : this.columns,
	            collection : this.filteredEpisodes,
	            className  : 'table table-hover season-grid'
	        });
	
	        this.episodeGrid.show(this.episodeGridView);
	    },
	
	    _setInitialSort : function () {
	        if (!this.model) {
	            this.filteredEpisodes.setSorting('seasonEpisode', 1, { sortValue: this._seasonEpisodeSorter });
	            this.filteredEpisodes.fullCollection.sort();
	        }
	    },
	
	    _getQualities : function() {
	        var self = this;
	
	        var profileSchemaCollection = new ProfileSchemaCollection();
	        var promise = profileSchemaCollection.fetch();
	
	        promise.done(function() {
	            var profile = profileSchemaCollection.first();
	
	            self.qualitySelectView = new QualitySelectView({ qualities: _.map(profile.get('items'), 'quality') });
	            self.listenTo(self.qualitySelectView, 'seasonedit:quality', self._changeQuality);
	
	            self.quality.show(self.qualitySelectView);
	        });
	    },
	
	    _changeQuality : function(options) {
	        var newQuality = {
	            quality  : options.selected,
	            revision : {
	                version : 1,
	                real    : 0
	            }
	        };
	
	        var selected = this._getSelectedEpisodeFileIds();
	
	        _.each(selected, function(episodeFileId) {
	            if (reqres.hasHandler(reqres.Requests.GetEpisodeFileById)) {
	                var episodeFile = reqres.request(reqres.Requests.GetEpisodeFileById, episodeFileId);
	                episodeFile.set('quality', newQuality);
	                episodeFile.save();
	            }
	        });
	    },
	
	    _deleteFiles : function() {
	        if (!window.confirm('Are you sure you want to delete the episode files for the selected episodes?')) {
	            return;
	        }
	
	        var selected = this._getSelectedEpisodeFileIds();
	
	        _.each(selected, function(episodeFileId) {
	            if (reqres.hasHandler(reqres.Requests.GetEpisodeFileById)) {
	                var episodeFile = reqres.request(reqres.Requests.GetEpisodeFileById, episodeFileId);
	
	                episodeFile.destroy();
	            }
	        });
	
	        _.each(this.episodeGridView.getSelectedModels(), function(episode) {
	            this.episodeGridView.removeRow(episode);
	        }, this);
	    },
	
	    _getSelectedEpisodeFileIds: function () {
	        return _.uniq(_.map(this.episodeGridView.getSelectedModels(), function (episode) {
	            return episode.get('episodeFileId');
	        }));
	    },
	
	    _seasonEpisodeSorter : function (model, attr) {
	        var seasonNumber = FormatHelpers.pad(model.get('seasonNumber'), 4, 0);
	        var episodeNumber = FormatHelpers.pad(model.get('episodeNumber'), 4, 0);
	
	        return seasonNumber + episodeNumber;
	    }
	});


/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var BackgridSelectAll = __webpack_require__(120);
	
	module.exports = BackgridSelectAll.extend({
	    enterEditMode : function(e) {
	        var collection = this.column.get('sortedCollection') || this.model.collection;
	
	        if (e.shiftKey && collection.lastToggled) {
	            this._selectRange(collection);
	        }
	
	        var checked = $(e.target).prop('checked');
	
	        collection.lastToggled = this.model;
	        collection.checked = checked;
	    },
	
	    onChange : function(e) {
	        var checked = $(e.target).prop('checked');
	        this.$el.parent().toggleClass('selected', checked);
	        this.model.trigger('backgrid:selected', this.model, checked);
	    },
	
	    _selectRange : function(collection) {
	        var lastToggled = collection.lastToggled;
	        var checked = collection.checked;
	
	        var currentIndex = collection.indexOf(this.model);
	        var lastIndex = collection.indexOf(lastToggled);
	
	        var low = Math.min(currentIndex, lastIndex);
	        var high = Math.max(currentIndex, lastIndex);
	        var range = _.range(low + 1, high);
	
	        _.each(range, function(index) {
	            var model = collection.at(index);
	
	            model.trigger('backgrid:select', model, checked);
	        });
	
	        collection.lastToggled = undefined;
	        collection.checked = undefined;
	    }
	});

/***/ },
/* 120 */,
/* 121 */,
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var NzbDroneCell = __webpack_require__(96);
	var reqres = __webpack_require__(115);
	var SeriesCollection = __webpack_require__(123);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-number-cell',
	    template  : 'Series/Details/EpisodeNumberCellTemplate',
	
	    render : function() {
	        this.$el.empty();
	        this.$el.html(this.model.get('episodeNumber'));
	
	        var series = SeriesCollection.get(this.model.get('seriesId'));
	
	        if (series.get('seriesType') === 'anime' && this.model.has('absoluteEpisodeNumber')) {
	            this.$el.html('{0} ({1})'.format(this.model.get('episodeNumber'), this.model.get('absoluteEpisodeNumber')));
	        }
	
	        var alternateTitles = [];
	
	        if (reqres.hasHandler(reqres.Requests.GetAlternateNameBySeasonNumber)) {
	            alternateTitles = reqres.request(reqres.Requests.GetAlternateNameBySeasonNumber, this.model.get('seriesId'), this.model.get('seasonNumber'), this.model.get('sceneSeasonNumber'));
	        }
	
	        if (this.model.get('sceneSeasonNumber') > 0 || this.model.get('sceneEpisodeNumber') > 0 || this.model.has('sceneAbsoluteEpisodeNumber') || alternateTitles.length > 0) {
	            this.templateFunction = Marionette.TemplateCache.get(this.template);
	
	            var json = this.model.toJSON();
	            json.alternateTitles = alternateTitles;
	
	            var html = this.templateFunction(json);
	
	            this.$el.popover({
	                content   : html,
	                html      : true,
	                trigger   : 'hover',
	                title     : 'Scene Information',
	                placement : 'right',
	                container : this.$el
	            });
	        }
	
	        this.delegateEvents();
	        return this;
	    }
	});

/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Backbone = __webpack_require__(6);
	var PageableCollection = __webpack_require__(29);
	var SeriesModel = __webpack_require__(31);
	var ApiData = __webpack_require__(23);
	var AsFilteredCollection = __webpack_require__(65);
	var AsSortedCollection = __webpack_require__(34);
	var AsPersistedStateCollection = __webpack_require__(66);
	var moment = __webpack_require__(17);
	__webpack_require__(39);
	
	var Collection = PageableCollection.extend({
	    url       : window.NzbDrone.ApiRoot + '/series',
	    model     : SeriesModel,
	    tableName : 'series',
	
	    state : {
	        sortKey            : 'sortTitle',
	        order              : -1,
	        pageSize           : 100000,
	        secondarySortKey   : 'sortTitle',
	        secondarySortOrder : -1
	    },
	
	    mode : 'client',
	
	    save : function() {
	        var self = this;
	
	        var proxy = _.extend(new Backbone.Model(), {
	            id : '',
	
	            url : self.url + '/editor',
	
	            toJSON : function() {
	                return self.filter(function(model) {
	                    return model.edited;
	                });
	            }
	        });
	
	        this.listenTo(proxy, 'sync', function(proxyModel, models) {
	            this.add(models, { merge : true });
	            this.trigger('save', this);
	        });
	
	        return proxy.save();
	    },
	
	    filterModes : {
	        'all'        : [
	            null,
	            null
	        ],
	        'continuing' : [
	            'status',
	            'continuing'
	        ],
	        'ended'      : [
	            'status',
	            'ended'
	        ],
	        'monitored'  : [
	            'monitored',
	            true
	        ],
	        'missing'  : [
	            null,
	            null,
	            function(model) { return model.get('episodeCount') !== model.get('episodeFileCount'); }
	        ]
	    },
	
	    sortMappings : {
	        title : {
	            sortKey : 'sortTitle'
	        },
	
	        nextAiring : {
	            sortValue : function(model, attr, order) {
	                var nextAiring = model.get(attr);
	
	                if (nextAiring) {
	                    return moment(nextAiring).unix();
	                }
	
	                if (order === 1) {
	                    return 0;
	                }
	
	                return Number.MAX_VALUE;
	            }
	        },
	
	        percentOfEpisodes : {
	            sortValue : function(model, attr) {
	                var percentOfEpisodes = model.get(attr);
	                var episodeCount = model.get('episodeCount');
	
	                return percentOfEpisodes + episodeCount / 1000000;
	            }
	        },
	
	        path : {
	            sortValue : function(model) {
	                var path = model.get('path');
	
	                return path.toLowerCase();
	            }
	        }
	    }
	});
	
	Collection = AsFilteredCollection.call(Collection);
	Collection = AsSortedCollection.call(Collection);
	Collection = AsPersistedStateCollection.call(Collection);
	
	var data = ApiData.get('series');
	
	module.exports = new Collection(data, { full : true }).bindSignalR();


/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var FormatHelpers = __webpack_require__(20);
	var _ = __webpack_require__(8);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-number-cell',
	
	    render : function() {
	
	        this.$el.empty();
	
	        var airDateField = this.column.get('airDateUtc') || 'airDateUtc';
	        var seasonField = this.column.get('seasonNumber') || 'seasonNumber';
	        var episodeField = this.column.get('episodes') || 'episodeNumber';
	        var absoluteEpisodeField = 'absoluteEpisodeNumber';
	
	        if (this.model) {
	            var result = 'Unknown';
	
	            var airDate = this.model.get(airDateField);
	            var seasonNumber = this.model.get(seasonField);
	            var episodes = this.model.get(episodeField);
	            var absoluteEpisodeNumber = this.model.get(absoluteEpisodeField);
	
	            if (this.cellValue) {
	                if (!seasonNumber) {
	                    seasonNumber = this.cellValue.get(seasonField);
	                }
	
	                if (!episodes) {
	                    episodes = this.cellValue.get(episodeField);
	                }
	
	                if (absoluteEpisodeNumber === undefined) {
	                    absoluteEpisodeNumber = this.cellValue.get(absoluteEpisodeField);
	                }
	
	                if (!airDate) {
	                    this.model.get(airDateField);
	                }
	            }
	
	            if (episodes) {
	
	                var paddedEpisodes;
	                var paddedAbsoluteEpisode;
	
	                if (episodes.constructor === Array) {
	                    paddedEpisodes = _.map(episodes, function(episodeNumber) {
	                        return FormatHelpers.pad(episodeNumber, 2);
	                    }).join();
	                } else {
	                    paddedEpisodes = FormatHelpers.pad(episodes, 2);
	                    paddedAbsoluteEpisode = FormatHelpers.pad(absoluteEpisodeNumber, 2);
	                }
	
	                result = '{0}x{1}'.format(seasonNumber, paddedEpisodes);
	
	                if (absoluteEpisodeNumber !== undefined && paddedAbsoluteEpisode) {
	                    result += ' ({0})'.format(paddedAbsoluteEpisode);
	                }
	            } else if (airDate) {
	                result = new Date(airDate).toLocaleDateString();
	            }
	
	            this.$el.html(result);
	        }
	        this.delegateEvents();
	        return this;
	    }
	});

/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	var reqres = __webpack_require__(115);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-file-path-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        if (reqres.hasHandler(reqres.Requests.GetEpisodeFileById)) {
	            var episodeFile = reqres.request(reqres.Requests.GetEpisodeFileById, this.model.get('episodeFileId'));
	
	            this.$el.html(episodeFile.get('relativePath'));
	        }
	
	        this.delegateEvents();
	        return this;
	    }
	});

/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	var reqres = __webpack_require__(115);
	var Backbone = __webpack_require__(6);
	var NzbDroneCell = __webpack_require__(96);
	var QueueCollection = __webpack_require__(28);
	var moment = __webpack_require__(17);
	var FormatHelpers = __webpack_require__(20);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-status-cell',
	
	    render : function() {
	        this.listenTo(QueueCollection, 'sync', this._renderCell);
	
	        this._renderCell();
	
	        return this;
	    },
	
	    _renderCell : function() {
	
	        if (this.episodeFile) {
	            this.stopListening(this.episodeFile, 'change', this._refresh);
	        }
	
	        this.$el.empty();
	
	        if (this.model) {
	
	            var icon;
	            var tooltip;
	
	            var hasAired = moment(this.model.get('airDateUtc')).isBefore(moment());
	            this.episodeFile = this._getFile();
	
	            if (this.episodeFile) {
	                this.listenTo(this.episodeFile, 'change', this._refresh);
	
	                var quality = this.episodeFile.get('quality');
	                var revision = quality.revision;
	                var size = FormatHelpers.bytes(this.episodeFile.get('size'));
	                var title = 'Episode downloaded';
	
	                if (revision.real && revision.real > 0) {
	                    title += '[REAL]';
	                }
	
	                if (revision.version && revision.version > 1) {
	                    title += ' [PROPER]';
	                }
	
	                if (size !== '') {
	                    title += ' - {0}'.format(size);
	                }
	
	                if (this.episodeFile.get('qualityCutoffNotMet')) {
	                    this.$el.html('<span class="badge badge-inverse" title="{0}">{1}</span>'.format(title, quality.quality.name));
	                } else {
	                    this.$el.html('<span class="badge" title="{0}">{1}</span>'.format(title, quality.quality.name));
	                }
	
	                return;
	            }
	
	            else {
	                var model = this.model;
	                var downloading = QueueCollection.findEpisode(model.get('id'));
	
	                if (downloading) {
	                    var progress = 100 - (downloading.get('sizeleft') / downloading.get('size') * 100);
	
	                    if (progress === 0) {
	                        icon = 'icon-sonarr-downloading';
	                        tooltip = 'Episode is downloading';
	                    }
	
	                    else {
	                        this.$el.html('<div class="progress" title="Episode is downloading - {0}% {1}">'.format(progress.toFixed(1), downloading.get('title')) +
	                                      '<div class="progress-bar progress-bar-purple" style="width: {0}%;"></div></div>'.format(progress));
	                        return;
	                    }
	                }
	
	                else if (this.model.get('grabbed')) {
	                    icon = 'icon-sonarr-downloading';
	                    tooltip = 'Episode is downloading';
	                }
	
	                else if (!this.model.get('airDateUtc')) {
	                    icon = 'icon-sonarr-tba';
	                    tooltip = 'TBA';
	                }
	
	                else if (hasAired) {
	                    icon = 'icon-sonarr-missing';
	                    tooltip = 'Episode missing from disk';
	                } else {
	                    icon = 'icon-sonarr-not-aired';
	                    tooltip = 'Episode has not aired';
	                }
	            }
	
	            this.$el.html('<i class="{0}" title="{1}"/>'.format(icon, tooltip));
	        }
	    },
	
	    _getFile : function() {
	        var hasFile = this.model.get('hasFile');
	
	        if (hasFile) {
	            var episodeFile;
	
	            if (reqres.hasHandler(reqres.Requests.GetEpisodeFileById)) {
	                episodeFile = reqres.request(reqres.Requests.GetEpisodeFileById, this.model.get('episodeFileId'));
	            }
	
	            else if (this.model.has('episodeFile')) {
	                episodeFile = new Backbone.Model(this.model.get('episodeFile'));
	            }
	
	            if (episodeFile) {
	                return episodeFile;
	            }
	        }
	
	        return undefined;
	    }
	});

/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var moment = __webpack_require__(17);
	var FormatHelpers = __webpack_require__(20);
	var UiSettings = __webpack_require__(22);
	
	module.exports = NzbDroneCell.extend({
	    className : 'relative-date-cell',
	
	    render : function() {
	
	        var dateStr = this.model.get(this.column.get('name'));
	
	        if (dateStr) {
	            var date = moment(dateStr);
	            var diff = date.diff(moment().zone(date.zone()).startOf('day'), 'days', true);
	            var result = '<span title="{0}">{1}</span>';
	            var tooltip = date.format(UiSettings.longDateTime());
	            var text;
	
	            if (diff > 0 && diff < 1) {
	                text = date.format(UiSettings.time(true, false));
	            } else {
	                if (UiSettings.get('showRelativeDates')) {
	                    text = FormatHelpers.relativeDate(dateStr);
	                } else {
	                    text = date.format(UiSettings.get('shortDateFormat'));
	                }
	            }
	
	            this.$el.html(result.format(tooltip, text));
	        }
	        return this;
	    }
	});

/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var PageableCollection = __webpack_require__(29);
	var EpisodeModel = __webpack_require__(32);
	__webpack_require__(128);
	
	module.exports = PageableCollection.extend({
	    url   : window.NzbDrone.ApiRoot + '/episode',
	    model : EpisodeModel,
	
	    state : {
	        sortKey  : 'episodeNumber',
	        order    : 1,
	        pageSize : 100000
	    },
	
	    mode : 'client',
	
	    originalFetch : Backbone.Collection.prototype.fetch,
	
	    initialize : function(options) {
	        this.seriesId = options.seriesId;
	    },
	
	    bySeason : function(season) {
	        var filtered = this.filter(function(episode) {
	            return episode.get('seasonNumber') === season;
	        });
	
	        var EpisodeCollection = __webpack_require__(128);
	
	        return new EpisodeCollection(filtered);
	    },
	
	    comparator : function(model1, model2) {
	        var episode1 = model1.get('episodeNumber');
	        var episode2 = model2.get('episodeNumber');
	
	        if (episode1 < episode2) {
	            return 1;
	        }
	
	        if (episode1 > episode2) {
	            return -1;
	        }
	
	        return 0;
	    },
	
	    fetch : function(options) {
	        if (!this.seriesId) {
	            throw 'seriesId is required';
	        }
	
	        if (!options) {
	            options = {};
	        }
	
	        options.data = { seriesId : this.seriesId };
	
	        return this.originalFetch.call(this, options);
	    }
	});

/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var ProfileModel = __webpack_require__(45);
	
	module.exports = Backbone.Collection.extend({
	    model : ProfileModel,
	    url   : window.NzbDrone.ApiRoot + '/profile/schema'
	});

/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'EpisodeFile/Editor/QualitySelectViewTemplate',
	
	    ui : {
	        select : '.x-select'
	    },
	
	    events : {
	        'change .x-select' : '_changeSelect'
	    },
	
	    initialize : function (options) {
	        this.qualities = options.qualities;
	
	        this.templateHelpers = {
	            qualities : this.qualities
	        };
	    },
	
	    _changeSelect : function () {
	        var value =  this.ui.select.val();
	
	        if (value === 'choose') {
	            return;
	        }
	
	        var quality = _.find(this.qualities, { 'id': parseInt(value) });
	
	        this.trigger('seasonedit:quality', { selected : quality });
	        this.ui.select.val('choose');
	    }
	});

/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'EpisodeFile/Editor/EmptyViewTemplate'
	});

/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var HistoryCollection = __webpack_require__(133);
	var EventTypeCell = __webpack_require__(135);
	var QualityCell = __webpack_require__(136);
	var RelativeDateCell = __webpack_require__(127);
	var EpisodeHistoryActionsCell = __webpack_require__(138);
	var EpisodeHistoryDetailsCell = __webpack_require__(139);
	var NoHistoryView = __webpack_require__(142);
	var LoadingView = __webpack_require__(117);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Movies/History/MovieHistoryLayoutTemplate',
	
	    regions : {
	        historyTable : '.history-table'
	    },
	
	    columns : [
	        {
	            name      : 'eventType',
	            label     : '',
	            cell      : EventTypeCell,
	            cellValue : 'this'
	        },
	        {
	            name  : 'sourceTitle',
	            label : 'Source Title',
	            cell  : 'string'
	        },
	        {
	            name  : 'quality',
	            label : 'Quality',
	            cell  : QualityCell
	        },
	        {
	            name  : 'date',
	            label : 'Date',
	            cell  : RelativeDateCell
	        },
	        {
	            name     : 'this',
	            label    : '',
	            cell     : EpisodeHistoryDetailsCell,
	            sortable : false
	        },
	        {
	            name     : 'this',
	            label    : '',
	            cell     : EpisodeHistoryActionsCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function(options) {
	        this.model = options.model;
	
	        this.collection = new HistoryCollection({
	            movieId : this.model.id,
	            tableName : 'episodeHistory'
	        });
	        this.collection.fetch();
	        this.listenTo(this.collection, 'sync', this._showTable);
	    },
	
	    onRender : function() {
	        this.historyTable.show(new LoadingView());
	    },
	
	    _showTable : function() {
	        if (this.collection.any()) {
	            this.historyTable.show(new Backgrid.Grid({
	                collection : this.collection,
	                columns    : this.columns,
	                className  : 'table table-hover table-condensed'
	            }));
	        }
	
	        else {
	            this.historyTable.show(new NoHistoryView());
	        }
	    }
	});


/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	var HistoryModel = __webpack_require__(134);
	var PageableCollection = __webpack_require__(29);
	var AsFilteredCollection = __webpack_require__(65);
	var AsSortedCollection = __webpack_require__(34);
	var AsPersistedStateCollection = __webpack_require__(66);
	
	var Collection = PageableCollection.extend({
	    url   : window.NzbDrone.ApiRoot + '/history',
	    model : HistoryModel,
	
	    state : {
	        pageSize : 15,
	        sortKey  : 'date',
	        order    : 1
	    },
	
	    queryParams : {
	        totalPages   : null,
	        totalRecords : null,
	        pageSize     : 'pageSize',
	        sortKey      : 'sortKey',
	        order        : 'sortDir',
	        directions   : {
	            '-1' : 'asc',
	            '1'  : 'desc'
	        }
	    },
	
	    filterModes : {
	        'all'      : [
	            null,
	            null
	        ],
	        'grabbed'  : [
	            'eventType',
	            '1'
	        ],
	        'imported' : [
	            'eventType',
	            '3'
	        ],
	        'failed'   : [
	            'eventType',
	            '4'
	        ],
	        'deleted'  : [
	            'eventType',
	            '5'
	        ]
	    },
	
	    sortMappings : {
	        'movie' : { sortKey : 'movie.title' }
	    },
	
	    initialize : function(options) {
	        delete this.queryParams.episodeId;
	        delete this.queryParams.movieId;
	
	        if (options) {
	            if (options.episodeId) {
	                this.queryParams.episodeId = options.episodeId;
	            }
	            if (options.movieId) {
	                this.queryParams.movieId = options.movieId;
	            }
	        }
	    },
	
	    parseState : function(resp) {
	        return { totalRecords : resp.totalRecords };
	    },
	
	    parseRecords : function(resp) {
	        if (resp) {
	            return resp.records;
	        }
	
	        return resp;
	    }
	});
	
	Collection = AsFilteredCollection.call(Collection);
	Collection = AsSortedCollection.call(Collection);
	Collection = AsPersistedStateCollection.call(Collection);
	
	module.exports = Collection;


/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var SeriesModel = __webpack_require__(31);
	var EpisodeModel = __webpack_require__(32);
	var MovieModel = __webpack_require__(33);
	
	module.exports = Backbone.Model.extend({
	    parse : function(model) {
	        if (model.series) {
	          model.series = new SeriesModel(model.series);
	          model.episode = new EpisodeModel(model.episode);
	          model.episode.set('series', model.series);
	        }
	
	        if (model.movie) {
	            model.movie = new MovieModel(model.movie);
	        }
	
	        return model;
	    }
	});


/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'history-event-type-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.cellValue) {
	            var icon;
	            var toolTip;
	
	            switch (this.cellValue.get('eventType')) {
	                case 'grabbed':
	                    icon = 'icon-sonarr-downloading';
	                    toolTip = 'Movie grabbed from {0} and sent to download client'.format(this.cellValue.get('data').indexer);
	                    break;
	                case 'seriesFolderImported':
	                    icon = 'icon-sonarr-hdd';
	                    toolTip = 'Existing movie file added to library';
	                    break;
	                case 'downloadFolderImported':
	                    icon = 'icon-sonarr-imported';
	                    toolTip = 'Movie downloaded successfully and picked up from download client';
	                    break;
	                case 'downloadFailed':
	                    icon = 'icon-sonarr-download-failed';
	                    toolTip = 'Movie download failed';
	                    break;
	                case 'episodeFileDeleted':
	                    icon = 'icon-sonarr-deleted';
	                    toolTip = 'Movie file deleted';
	                    break;
	                default:
	                    icon = 'icon-sonarr-unknown';
	                    toolTip = 'unknown event';
	            }
	
	            this.$el.html('<i class="{0}" title="{1}" data-placement="right"/>'.format(icon, toolTip));
	        }
	
	        return this;
	    }
	});


/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	var TemplatedCell = __webpack_require__(95);
	var QualityCellEditor = __webpack_require__(137);
	
	module.exports = TemplatedCell.extend({
	    className : 'quality-cell',
	    template  : 'Cells/QualityCellTemplate',
	    editor    : QualityCellEditor
	});

/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Backgrid = __webpack_require__(80);
	var Marionette = __webpack_require__(11);
	var ProfileSchemaCollection = __webpack_require__(129);
	
	module.exports = Backgrid.CellEditor.extend({
	    className : 'quality-cell-editor',
	    template  : 'Cells/Edit/QualityCellEditorTemplate',
	    tagName   : 'select',
	
	    events : {
	        'change'  : 'save',
	        'blur'    : 'close',
	        'keydown' : 'close'
	    },
	
	    render : function() {
	        var self = this;
	
	        var profileSchemaCollection = new ProfileSchemaCollection();
	        var promise = profileSchemaCollection.fetch();
	
	        promise.done(function() {
	            var templateName = self.template;
	            self.schema = profileSchemaCollection.first();
	
	            var selected = _.find(self.schema.get('items'), function(model) {
	                return model.quality.id === self.model.get(self.column.get('name')).quality.id;
	            });
	
	            if (selected) {
	                selected.quality.selected = true;
	            }
	
	            self.templateFunction = Marionette.TemplateCache.get(templateName);
	            var data = self.schema.toJSON();
	            var html = self.templateFunction(data);
	            self.$el.html(html);
	        });
	
	        return this;
	    },
	
	    save : function(e) {
	        var model = this.model;
	        var column = this.column;
	        var selected = parseInt(this.$el.val(), 10);
	
	        var profileItem = _.find(this.schema.get('items'), function(model) {
	            return model.quality.id === selected;
	        });
	
	        var newQuality = {
	            quality  : profileItem.quality,
	            revision : {
	                version : 1,
	                real    : 0
	            }
	        };
	
	        model.set(column.get('name'), newQuality);
	        model.save();
	
	        model.trigger('backgrid:edited', model, column, new Backgrid.Command(e));
	    },
	
	    close : function(e) {
	        var model = this.model;
	        var column = this.column;
	        var command = new Backgrid.Command(e);
	
	        model.trigger('backgrid:edited', model, column, command);
	    }
	});

/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-actions-cell',
	
	    events : {
	        'click .x-failed' : '_markAsFailed'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.model.get('eventType') === 'grabbed') {
	            this.$el.html('<i class="icon-sonarr-delete x-failed" title="Mark download as failed"></i>');
	        }
	
	        return this;
	    },
	
	    _markAsFailed : function() {
	        var url = window.NzbDrone.ApiRoot + '/history/failed';
	        var data = {
	            id : this.model.get('id')
	        };
	
	        $.ajax({
	            url  : url,
	            type : 'POST',
	            data : data
	        });
	    }
	});

/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var NzbDroneCell = __webpack_require__(96);
	var HistoryDetailsView = __webpack_require__(140);
	__webpack_require__(73);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-history-details-cell',
	
	    render : function() {
	        this.$el.empty();
	        this.$el.html('<i class="icon-sonarr-form-info"></i>');
	
	        var html = new HistoryDetailsView({ model : this.model }).render().$el;
	
	        this.$el.popover({
	            content   : html,
	            html      : true,
	            trigger   : 'hover',
	            title     : 'Details',
	            placement : 'left',
	            container : this.$el
	        });
	
	        return this;
	    }
	});

/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	__webpack_require__(141);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Activity/History/Details/HistoryDetailsViewTemplate'
	});

/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	var Handlebars = __webpack_require__(14);
	var FormatHelpers = __webpack_require__(20);
	
	Handlebars.registerHelper('historyAge', function() {
	
	    var age = this.age;
	    var unit = FormatHelpers.plural(Math.round(age), 'day');
	    var ageHours = parseFloat(this.ageHours);
	    var ageMinutes = this.ageMinutes ? parseFloat(this.ageMinutes) : null;
	
	    if (age < 2) {
	        age = ageHours.toFixed(1);
	        unit = FormatHelpers.plural(Math.round(ageHours), 'hour');
	    }
	
	    if (age < 2 && ageMinutes) {
	        age = parseFloat(ageMinutes).toFixed(1);
	        unit = FormatHelpers.plural(Math.round(ageMinutes), 'minute');
	    }
	
	    return new Handlebars.SafeString('<dt>Age (when grabbed):</dt><dd>{0} {1}</dd>'.format(age, unit));
	});


/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Movies/History/NoHistoryViewTemplate'
	});


/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var ButtonsView = __webpack_require__(144);
	var ManualSearchLayout = __webpack_require__(145);
	var ReleaseCollection = __webpack_require__(154);
	var CommandController = __webpack_require__(86);
	var LoadingView = __webpack_require__(117);
	var NoResultsView = __webpack_require__(156);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Movies/Search/MovieSearchLayoutTemplate',
	
	    regions : {
	        main : '#episode-search-region'
	    },
	
	    events : {
	        'click .x-search-auto'   : '_searchAuto',
	        'click .x-search-manual' : '_searchManual',
	        'click .x-search-back'   : '_showButtons'
	    },
	
	    initialize : function() {
	        this.mainView = new ButtonsView();
	        this.releaseCollection = new ReleaseCollection();
	
	        this.listenTo(this.releaseCollection, 'sync', this._showSearchResults);
	    },
	
	    onShow : function() {
	        if (this.startManualSearch) {
	            this._searchManual();
	        }
	
	        else {
	            this._showMainView();
	        }
	    },
	
	    _searchAuto : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        CommandController.Execute('episodeSearch', {
	            episodeIds : [this.model.get('id')]
	        });
	
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _searchManual : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.mainView = new LoadingView();
	        this._showMainView();
	        this.releaseCollection.fetchMovieReleases(this.model.id);
	    },
	
	    _showMainView : function() {
	        this.main.show(this.mainView);
	    },
	
	    _showButtons : function() {
	        this.mainView = new ButtonsView();
	        this._showMainView();
	    },
	
	    _showSearchResults : function() {
	        if (this.releaseCollection.length === 0) {
	            this.mainView = new NoResultsView();
	        }
	
	        else {
	            this.mainView = new ManualSearchLayout({ collection : this.releaseCollection });
	        }
	
	        this._showMainView();
	    }
	});


/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Movies/Search/ButtonsViewTemplate'
	});


/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var ReleaseTitleCell = __webpack_require__(146);
	var FileSizeCell = __webpack_require__(147);
	var QualityCell = __webpack_require__(136);
	var ApprovalStatusCell = __webpack_require__(148);
	var DownloadReportCell = __webpack_require__(149);
	var AgeCell = __webpack_require__(150);
	var ProtocolCell = __webpack_require__(151);
	var PeersCell = __webpack_require__(152);
	var EditionCell = __webpack_require__(153);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Movies/Search/ManualLayoutTemplate',
	
	    regions : {
	        grid : '#episode-release-grid'
	    },
	
	    columns : [
	        {
	            name  : 'protocol',
	            label : 'Source',
	            cell  : ProtocolCell
	        },
	        {
	            name  : 'age',
	            label : 'Age',
	            cell  : AgeCell
	        },
	        {
	            name  : 'title',
	            label : 'Title',
	            cell  : ReleaseTitleCell
	        },
	        {
	            name  : 'edition',
	            label : 'Edition',
	            cell  : EditionCell,
	            title : "Edition"
	        },
	        {
	            name  : 'indexer',
	            label : 'Indexer',
	            cell  : Backgrid.StringCell
	        },
	        {
	            name  : 'size',
	            label : 'Size',
	            cell  : FileSizeCell
	        },
	        {
	            name  : 'seeders',
	            label : 'Peers',
	            cell  : PeersCell
	        },
	        {
	            name  : 'quality',
	            label : 'Quality',
	            cell  : QualityCell
	        },
	        {
	            name      : 'rejections',
	            label     : '<i class="icon-sonarr-header-rejections" />',
	            tooltip   : 'Rejections',
	            cell      : ApprovalStatusCell,
	            sortable  : true,
	            sortType  : 'fixed',
	            direction : 'ascending',
	            title     : 'Release Rejected'
	        },
	        {
	            name      : 'download',
	            label     : '<i class="icon-sonarr-download" />',
	            tooltip   : 'Auto-Search Prioritization',
	            cell      : DownloadReportCell,
	            sortable  : true,
	            sortType  : 'fixed',
	            direction : 'ascending'
	        }
	    ],
	
	    onShow : function() {
	        if (!this.isClosed) {
	            this.grid.show(new Backgrid.Grid({
	                row        : Backgrid.Row,
	                columns    : this.columns,
	                collection : this.collection,
	                className  : 'table table-hover'
	            }));
	        }
	    }
	});


/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'release-title-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var title = this.model.get('title');
	        var infoUrl = this.model.get('infoUrl');
	
	        if (infoUrl) {
	            this.$el.html('<a href="{0}">{1}</a>'.format(infoUrl, title));
	        } else {
	            this.$el.html(title);
	        }
	
	        return this;
	    }
	});

/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	var FormatHelpers = __webpack_require__(20);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'file-size-cell',
	
	    render : function() {
	        var size = this.model.get(this.column.get('name'));
	        this.$el.html(FormatHelpers.bytes(size));
	        this.delegateEvents();
	        return this;
	    }
	});

/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	var Marionette = __webpack_require__(11);
	__webpack_require__(73);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'approval-status-cell',
	    template  : 'Cells/ApprovalStatusCellTemplate',
	
	    render : function() {
	
	        var rejections = this.model.get(this.column.get('name'));
	
	        if (rejections.length === 0) {
	            return this;
	        }
	
	        this.templateFunction = Marionette.TemplateCache.get(this.template);
	
	        var html = this.templateFunction(rejections);
	        this.$el.html('<i class="icon-sonarr-form-danger"/>');
	
	        this.$el.popover({
	            content   : html,
	            html      : true,
	            trigger   : 'hover',
	            title     : this.column.get('title'),
	            placement : 'left',
	            container : this.$el
	        });
	
	        return this;
	    }
	});

/***/ },
/* 149 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'download-report-cell',
	
	    events : {
	        'click' : '_onClick'
	    },
	
	    _onClick : function() {
	        if (!this.model.get('downloadAllowed')) {
	            return;
	        }
	
	        var self = this;
	
	        this.$el.html('<i class="icon-sonarr-spinner fa-spin" title="Adding to download queue" />');
	
	        //Using success callback instead of promise so it
	        //gets called before the sync event is triggered
	        var promise = this.model.save(null, {
	            success : function() {
	                self.model.set('queued', true);
	            }
	        });
	
	        promise.fail(function (xhr) {
	            if (xhr.responseJSON && xhr.responseJSON.message) {
	                self.$el.html('<i class="icon-sonarr-download-failed" title="{0}" />'.format(xhr.responseJSON.message));
	            } else {
	                self.$el.html('<i class="icon-sonarr-download-failed" title="Failed to add to download queue" />');
	            }
	        });
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.model.get('queued')) {
	            this.$el.html('<i class="icon-sonarr-downloading" title="Added to downloaded queue" />');
	        } else if (this.model.get('downloadAllowed')) {
	            this.$el.html('<i class="icon-sonarr-download" title="Add to download queue" />');
	        } else {
	            this.className = 'no-download-report-cell';
	        }
	
	        return this;
	    }
	});

/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	var moment = __webpack_require__(17);
	var Backgrid = __webpack_require__(80);
	var UiSettings = __webpack_require__(22);
	var FormatHelpers = __webpack_require__(20);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'age-cell',
	
	    render : function() {
	        var age = this.model.get('age');
	        var ageHours = this.model.get('ageHours');
	        var ageMinutes = this.model.get('ageMinutes');
	        var published = moment(this.model.get('publishDate'));
	        var publishedFormatted = published.format('{0} {1}'.format(UiSettings.get('shortDateFormat'), UiSettings.time(true, true)));
	        var formatted = age;
	        var suffix = FormatHelpers.plural(age, 'day');
	
	        if (age < 2) {
	            formatted = ageHours.toFixed(1);
	            suffix = FormatHelpers.plural(Math.round(ageHours), 'hour');
	        }
	
	        if (ageHours < 2) {
	            formatted = ageMinutes.toFixed(1);
	            suffix = FormatHelpers.plural(Math.round(ageMinutes), 'minute');
	        }
	
	        this.$el.html('<div title="{2}">{0} {1}</div>'.format(formatted, suffix, publishedFormatted));
	
	        this.delegateEvents();
	        return this;
	    }
	});

/***/ },
/* 151 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'protocol-cell',
	
	    render : function() {
	        var protocol = this.model.get('protocol') || 'Unknown';
	        var label = '??';
	
	        if (protocol) {
	            if (protocol === 'torrent') {
	                label = 'torrent';
	            } else if (protocol === 'usenet') {
	                label = 'nzb';
	            }
	
	            this.$el.html('<div class="label label-default protocol-{0}" title="{0}">{1}</div>'.format(protocol, label));
	        }
	
	        this.delegateEvents();
	
	        return this;
	    }
	});

/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'peers-cell',
	
	    render : function() {
	        if (this.model.get('protocol') === 'torrent') {
	            var seeders = this.model.get('seeders') || 0;
	            var leechers = this.model.get('leechers') || 0;
	
	            var level = 'danger';
	
	            if (seeders > 0) {
	                level = 'warning';
	            } else if (seeders > 10) {
	                level = 'info';
	            } else if (seeders > 50) {
	                level = 'primary';
	            }
	
	            this.$el.html('<div class="label label-{2}" title="{0} seeders, {1} leechers">{0} / {1}</div>'.format(seeders, leechers, level));
	        }
	
	        this.delegateEvents();
	
	        return this;
	    }
	});

/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	var Marionette = __webpack_require__(11);
	__webpack_require__(73);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'edition-cell',
	    //template  : 'Cells/EditionCellTemplate',
	
	    render : function() {
	
	        var edition = this.model.get(this.column.get('name'));
	        if (!edition) {
	          return this;
	        }
	        var cut = false;
	
	        if (edition.toLowerCase().contains("cut")) {
	          cut = true;
	        }
	
	        //this.templateFunction = Marionette.TemplateCache.get(this.template);
	
	        //var html = this.templateFunction(edition);
	        if (cut) {
	          this.$el.html('<i class="icon-sonarr-form-cut"/ title="{0}">'.format(edition));
	        } else {
	          this.$el.html('<i class="icon-sonarr-form-special"/ title="{0}">'.format(edition));
	        }
	
	        /*this.$el.popover({
	            content   : html,
	            html      : true,
	            trigger   : 'hover',
	            title     : this.column.get('title'),
	            placement : 'left',
	            container : this.$el
	        });*/
	
	        return this;
	    }
	});


/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

	var PagableCollection = __webpack_require__(29);
	var ReleaseModel = __webpack_require__(155);
	var AsSortedCollection = __webpack_require__(34);
	
	var Collection = PagableCollection.extend({
	    url   : window.NzbDrone.ApiRoot + '/release',
	    model : ReleaseModel,
	
	    state : {
	        pageSize : 2000,
	        sortKey  : 'download',
	        order    : -1
	    },
	
	    mode : 'client',
	
	    sortMappings : {
	        'quality'    : {
	            sortKey : 'qualityWeight'
	        },
	        'rejections' : {
	            sortValue : function(model) {
	                var rejections = model.get('rejections');
	                var releaseWeight = model.get('releaseWeight');
	
	                if (rejections.length !== 0) {
	                    return releaseWeight + 1000000;
	                }
	
	                return releaseWeight;
	            }
	        },
	        'download'   : {
	            sortKey : 'releaseWeight'
	        },
	        'seeders'    : {
	            sortValue : function(model) {
	                var seeders = model.get('seeders') || 0;
	                var leechers = model.get('leechers') || 0;
	
	                return seeders * 1000000 + leechers;
	            }
	        },
	        'age'        : {
	            sortKey : 'ageMinutes'
	        }
	    },
	
	    fetchEpisodeReleases : function(episodeId) {
	        return this.fetch({ data : { episodeId : episodeId } });
	    },
	
	    fetchMovieReleases : function(movieId) {
	      return this.fetch({ data : { movieId : movieId}});
	    }
	
	});
	
	Collection = AsSortedCollection.call(Collection);
	
	module.exports = Collection;


/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Movies/Search/NoResultsViewTemplate'
	});


/***/ },
/* 157 */,
/* 158 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var reqres = __webpack_require__(115);
	var Marionette = __webpack_require__(11);
	var Backbone = __webpack_require__(6);
	var SeriesCollection = __webpack_require__(123);
	var EpisodeCollection = __webpack_require__(128);
	var EpisodeFileCollection = __webpack_require__(159);
	var SeasonCollection = __webpack_require__(161);
	var SeasonCollectionView = __webpack_require__(163);
	var InfoView = __webpack_require__(171);
	var CommandController = __webpack_require__(86);
	var LoadingView = __webpack_require__(117);
	var EpisodeFileEditorLayout = __webpack_require__(118);
	__webpack_require__(157);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    itemViewContainer : '.x-series-seasons',
	    template          : 'Series/Details/SeriesDetailsTemplate',
	
	    regions : {
	        seasons : '#seasons',
	        info    : '#info'
	    },
	
	    ui : {
	        header    : '.x-header',
	        monitored : '.x-monitored',
	        edit      : '.x-edit',
	        refresh   : '.x-refresh',
	        rename    : '.x-rename',
	        search    : '.x-search',
	        poster    : '.x-series-poster',
	        manualSearch : '.x-manual-search'
	    },
	
	    events : {
	        'click .x-episode-file-editor' : '_openEpisodeFileEditor',
	        'click .x-monitored'           : '_toggleMonitored',
	        'click .x-edit'                : '_editSeries',
	        'click .x-refresh'             : '_refreshSeries',
	        'click .x-rename'              : '_renameSeries',
	        'click .x-search'              : '_seriesSearch',
	        'click .x-manual-search'       : '_manualSearchM'
	    },
	
	    initialize : function() {
	        this.seriesCollection = SeriesCollection.clone();
	        this.seriesCollection.shadowCollection.bindSignalR();
	
	        this.listenTo(this.model, 'change:monitored', this._setMonitoredState);
	        this.listenTo(this.model, 'remove', this._seriesRemoved);
	        this.listenTo(vent, vent.Events.CommandComplete, this._commandComplete);
	
	        this.listenTo(this.model, 'change', function(model, options) {
	            if (options && options.changeSource === 'signalr') {
	                this._refresh();
	            }
	        });
	
	        this.listenTo(this.model,  'change:images', this._updateImages);
	    },
	
	    onShow : function() {
	        this._showBackdrop();
	        this._showSeasons();
	        this._setMonitoredState();
	        this._showInfo();
	    },
	
	    onRender : function() {
	        CommandController.bindToCommand({
	            element : this.ui.refresh,
	            command : {
	                name : 'refreshSeries'
	            }
	        });
	        CommandController.bindToCommand({
	            element : this.ui.search,
	            command : {
	                name : 'seriesSearch'
	            }
	        });
	
	        CommandController.bindToCommand({
	            element : this.ui.rename,
	            command : {
	                name         : 'renameFiles',
	                seriesId     : this.model.id,
	                seasonNumber : -1
	            }
	        });
	    },
	
	    onClose : function() {
	        if (this._backstrech) {
	            this._backstrech.destroy();
	            delete this._backstrech;
	        }
	
	        $('body').removeClass('backdrop');
	        reqres.removeHandler(reqres.Requests.GetEpisodeFileById);
	    },
	
	    _getImage : function(type) {
	        var image = _.where(this.model.get('images'), { coverType : type });
	
	        if (image && image[0]) {
	            return image[0].url;
	        }
	
	        return undefined;
	    },
	
	    _toggleMonitored : function() {
	        var savePromise = this.model.save('monitored', !this.model.get('monitored'), { wait : true });
	
	        this.ui.monitored.spinForPromise(savePromise);
	    },
	
	    _setMonitoredState : function() {
	        var monitored = this.model.get('monitored');
	
	        this.ui.monitored.removeAttr('data-idle-icon');
	        this.ui.monitored.removeClass('fa-spin icon-sonarr-spinner');
	
	        if (monitored) {
	            this.ui.monitored.addClass('icon-sonarr-monitored');
	            this.ui.monitored.removeClass('icon-sonarr-unmonitored');
	            this.$el.removeClass('series-not-monitored');
	        } else {
	            this.ui.monitored.addClass('icon-sonarr-unmonitored');
	            this.ui.monitored.removeClass('icon-sonarr-monitored');
	            this.$el.addClass('series-not-monitored');
	        }
	    },
	
	    _editSeries : function() {
	        vent.trigger(vent.Commands.EditSeriesCommand, { series : this.model });
	    },
	
	    _refreshSeries : function() {
	        CommandController.Execute('refreshSeries', {
	            name     : 'refreshSeries',
	            seriesId : this.model.id
	        });
	    },
	
	    _seriesRemoved : function() {
	        Backbone.history.navigate('/', { trigger : true });
	    },
	
	    _renameSeries : function() {
	        vent.trigger(vent.Commands.ShowRenamePreview, { series : this.model });
	    },
	
	    _seriesSearch : function() {
	        CommandController.Execute('seriesSearch', {
	            name     : 'seriesSearch',
	            seriesId : this.model.id
	        });
	    },
	
	    _showSeasons : function() {
	        var self = this;
	
	        this.seasons.show(new LoadingView());
	
	        this.seasonCollection = new SeasonCollection(this.model.get('seasons'));
	        this.episodeCollection = new EpisodeCollection({ seriesId : this.model.id }).bindSignalR();
	        this.episodeFileCollection = new EpisodeFileCollection({ seriesId : this.model.id }).bindSignalR();
	
	        reqres.setHandler(reqres.Requests.GetEpisodeFileById, function(episodeFileId) {
	            return self.episodeFileCollection.get(episodeFileId);
	        });
	
	        reqres.setHandler(reqres.Requests.GetAlternateNameBySeasonNumber, function(seriesId, seasonNumber, sceneSeasonNumber) {
	            if (self.model.get('id') !== seriesId) {
	                return [];
	            }
	
	            if (sceneSeasonNumber === undefined) {
	                sceneSeasonNumber = seasonNumber;
	            }
	
	            return _.where(self.model.get('alternateTitles'),
	                function(alt) {
	                    return alt.sceneSeasonNumber === sceneSeasonNumber || alt.seasonNumber === seasonNumber;
	                });
	        });
	
	        $.when(this.episodeCollection.fetch(), this.episodeFileCollection.fetch()).done(function() {
	            var seasonCollectionView = new SeasonCollectionView({
	                collection        : self.seasonCollection,
	                episodeCollection : self.episodeCollection,
	                series            : self.model
	            });
	
	            if (!self.isClosed) {
	                self.seasons.show(seasonCollectionView);
	            }
	        });
	    },
	
	    _showInfo : function() {
	        this.info.show(new InfoView({
	            model                 : this.model,
	            episodeFileCollection : this.episodeFileCollection
	        }));
	    },
	
	    _commandComplete : function(options) {
	        if (options.command.get('name') === 'renamefiles') {
	            if (options.command.get('seriesId') === this.model.get('id')) {
	                this._refresh();
	            }
	        }
	    },
	
	    _refresh : function() {
	        this.seasonCollection.add(this.model.get('seasons'), { merge : true });
	        this.episodeCollection.fetch();
	        this.episodeFileCollection.fetch();
	
	        this._setMonitoredState();
	        this._showInfo();
	    },
	
	    _openEpisodeFileEditor : function() {
	        var view = new EpisodeFileEditorLayout({
	            series            : this.model,
	            episodeCollection : this.episodeCollection
	        });
	
	        vent.trigger(vent.Commands.OpenModalCommand, view);
	    },
	
	    _updateImages : function () {
	        var poster = this._getImage('poster');
	
	        if (poster) {
	            this.ui.poster.attr('src', poster);
	        }
	
	        this._showBackdrop();
	    },
	
	    _showBackdrop : function () {
	        $('body').addClass('backdrop');
	        var fanArt = this._getImage('fanart');
	
	        if (fanArt) {
	            this._backstrech = $.backstretch(fanArt);
	        } else {
	            $('body').removeClass('backdrop');
	        }
	    },
	
	    _manualSearchM : function() {
	        console.warn("Manual Search started");
	        console.warn(this.model.get("seriesId"));
	        console.warn(this.model)
	        console.warn(this.episodeCollection);
	        vent.trigger(vent.Commands.ShowEpisodeDetails, {
	            episode        : this.episodeCollection.models[0],
	            hideSeriesLink : true,
	            openingTab     : 'search'
	        });
	    }
	});


/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var EpisodeFileModel = __webpack_require__(160);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/episodefile',
	    model : EpisodeFileModel,
	
	    originalFetch : Backbone.Collection.prototype.fetch,
	
	    initialize : function(options) {
	        this.seriesId = options.seriesId;
	        this.models = [];
	    },
	
	    fetch : function(options) {
	        if (!this.seriesId) {
	            throw 'seriesId is required';
	        }
	
	        if (!options) {
	            options = {};
	        }
	
	        options.data = { seriesId : this.seriesId };
	
	        return this.originalFetch.call(this, options);
	    }
	});

/***/ },
/* 160 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 161 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var SeasonModel = __webpack_require__(162);
	
	module.exports = Backbone.Collection.extend({
	    model : SeasonModel,
	
	    comparator : function(season) {
	        return -season.get('seasonNumber');
	    }
	});

/***/ },
/* 162 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({
	    defaults : {
	        seasonNumber : 0
	    },
	
	    initialize : function() {
	        this.set('id', this.get('seasonNumber'));
	    }
	});

/***/ },
/* 163 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var SeasonLayout = __webpack_require__(164);
	var AsSortedCollectionView = __webpack_require__(170);
	
	var view = Marionette.CollectionView.extend({
	
	    itemView : SeasonLayout,
	
	    initialize : function(options) {
	        if (!options.episodeCollection) {
	            throw 'episodeCollection is needed';
	        }
	
	        this.episodeCollection = options.episodeCollection;
	        this.series = options.series;
	    },
	
	    itemViewOptions : function() {
	        return {
	            episodeCollection : this.episodeCollection,
	            series            : this.series
	        };
	    },
	
	    onEpisodeGrabbed : function(message) {
	        if (message.episode.series.id !== this.episodeCollection.seriesId) {
	            return;
	        }
	
	        var self = this;
	
	        _.each(message.episode.episodes, function(episode) {
	            var ep = self.episodeCollection.get(episode.id);
	            ep.set('downloading', true);
	        });
	
	        this.render();
	    }
	});
	
	AsSortedCollectionView.call(view);
	
	module.exports = view;

/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var ToggleCell = __webpack_require__(165);
	var EpisodeTitleCell = __webpack_require__(167);
	var RelativeDateCell = __webpack_require__(127);
	var EpisodeStatusCell = __webpack_require__(126);
	var EpisodeActionsCell = __webpack_require__(168);
	var EpisodeNumberCell = __webpack_require__(122);
	var EpisodeWarningCell = __webpack_require__(169);
	var CommandController = __webpack_require__(86);
	var EpisodeFileEditorLayout = __webpack_require__(118);
	var moment = __webpack_require__(17);
	var _ = __webpack_require__(8);
	var Messenger = __webpack_require__(55);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Series/Details/SeasonLayoutTemplate',
	
	    ui : {
	        seasonSearch    : '.x-season-search',
	        seasonMonitored : '.x-season-monitored',
	        seasonRename    : '.x-season-rename'
	    },
	
	    events : {
	        'click .x-season-episode-file-editor' : '_openEpisodeFileEditor',
	        'click .x-season-monitored'           : '_seasonMonitored',
	        'click .x-season-search'              : '_seasonSearch',
	        'click .x-season-rename'              : '_seasonRename',
	        'click .x-show-hide-episodes'         : '_showHideEpisodes',
	        'dblclick .series-season h2'          : '_showHideEpisodes'
	    },
	
	    regions : {
	        episodeGrid : '.x-episode-grid'
	    },
	
	    columns : [
	        {
	            name       : 'monitored',
	            label      : '',
	            cell       : ToggleCell,
	            trueClass  : 'icon-sonarr-monitored',
	            falseClass : 'icon-sonarr-unmonitored',
	            tooltip    : 'Toggle monitored status',
	            sortable   : false
	        },
	        {
	            name  : 'episodeNumber',
	            label : '#',
	            cell  : EpisodeNumberCell
	        },
	        {
	            name      : 'this',
	            label     : '',
	            cell      : EpisodeWarningCell,
	            sortable  : false,
	            className : 'episode-warning-cell'
	        },
	        {
	            name           : 'this',
	            label          : 'Title',
	            hideSeriesLink : true,
	            cell           : EpisodeTitleCell,
	            sortable       : false
	        },
	        {
	            name  : 'airDateUtc',
	            label : 'Air Date',
	            cell  : RelativeDateCell
	        },
	        {
	            name     : 'status',
	            label    : 'Status',
	            cell     : EpisodeStatusCell,
	            sortable : false
	        },
	        {
	            name     : 'this',
	            label    : '',
	            cell     : EpisodeActionsCell,
	            sortable : false
	        }
	    ],
	
	    templateHelpers : function() {
	        var episodeCount = this.episodeCollection.filter(function(episode) {
	            return episode.get('hasFile') || episode.get('monitored') && moment(episode.get('airDateUtc')).isBefore(moment());
	        }).length;
	
	        var episodeFileCount = this.episodeCollection.where({ hasFile : true }).length;
	        var percentOfEpisodes = 100;
	
	        if (episodeCount > 0) {
	            percentOfEpisodes = episodeFileCount / episodeCount * 100;
	        }
	
	        return {
	            showingEpisodes   : this.showingEpisodes,
	            episodeCount      : episodeCount,
	            episodeFileCount  : episodeFileCount,
	            percentOfEpisodes : percentOfEpisodes
	        };
	    },
	
	    initialize : function(options) {
	        if (!options.episodeCollection) {
	            throw 'episodeCollection is required';
	        }
	
	        this.series = options.series;
	        this.fullEpisodeCollection = options.episodeCollection;
	        this.episodeCollection = this.fullEpisodeCollection.bySeason(this.model.get('seasonNumber'));
	        this._updateEpisodeCollection();
	
	        this.showingEpisodes = this._shouldShowEpisodes();
	
	        this.listenTo(this.model, 'sync', this._afterSeasonMonitored);
	        this.listenTo(this.episodeCollection, 'sync', this.render);
	
	        this.listenTo(this.fullEpisodeCollection, 'sync', this._refreshEpisodes);
	    },
	
	    onRender : function() {
	        if (this.showingEpisodes) {
	            this._showEpisodes();
	        }
	
	        this._setSeasonMonitoredState();
	
	        CommandController.bindToCommand({
	            element : this.ui.seasonSearch,
	            command : {
	                name         : 'seasonSearch',
	                seriesId     : this.series.id,
	                seasonNumber : this.model.get('seasonNumber')
	            }
	        });
	
	        CommandController.bindToCommand({
	            element : this.ui.seasonRename,
	            command : {
	                name         : 'renameFiles',
	                seriesId     : this.series.id,
	                seasonNumber : this.model.get('seasonNumber')
	            }
	        });
	    },
	
	    _seasonSearch : function() {
	        CommandController.Execute('seasonSearch', {
	            name         : 'seasonSearch',
	            seriesId     : this.series.id,
	            seasonNumber : this.model.get('seasonNumber')
	        });
	    },
	
	    _seasonRename : function() {
	        vent.trigger(vent.Commands.ShowRenamePreview, {
	            series       : this.series,
	            seasonNumber : this.model.get('seasonNumber')
	        });
	    },
	
	    _seasonMonitored : function() {
	        if (!this.series.get('monitored')) {
	
	            Messenger.show({
	                message : 'Unable to change monitored state when series is not monitored',
	                type    : 'error'
	            });
	
	            return;
	        }
	
	        var name = 'monitored';
	        this.model.set(name, !this.model.get(name));
	        this.series.setSeasonMonitored(this.model.get('seasonNumber'));
	
	        var savePromise = this.series.save().always(this._afterSeasonMonitored.bind(this));
	
	        this.ui.seasonMonitored.spinForPromise(savePromise);
	    },
	
	    _afterSeasonMonitored : function() {
	        var self = this;
	
	        _.each(this.episodeCollection.models, function(episode) {
	            episode.set({ monitored : self.model.get('monitored') });
	        });
	
	        this.render();
	    },
	
	    _setSeasonMonitoredState : function() {
	        this.ui.seasonMonitored.removeClass('icon-sonarr-spinner fa-spin');
	
	        if (this.model.get('monitored')) {
	            this.ui.seasonMonitored.addClass('icon-sonarr-monitored');
	            this.ui.seasonMonitored.removeClass('icon-sonarr-unmonitored');
	        } else {
	            this.ui.seasonMonitored.addClass('icon-sonarr-unmonitored');
	            this.ui.seasonMonitored.removeClass('icon-sonarr-monitored');
	        }
	    },
	
	    _showEpisodes : function() {
	        this.episodeGrid.show(new Backgrid.Grid({
	            columns    : this.columns,
	            collection : this.episodeCollection,
	            className  : 'table table-hover season-grid'
	        }));
	    },
	
	    _shouldShowEpisodes : function() {
	        var startDate = moment().add('month', -1);
	        var endDate = moment().add('year', 1);
	
	        return this.episodeCollection.some(function(episode) {
	            var airDate = episode.get('airDateUtc');
	
	            if (airDate) {
	                var airDateMoment = moment(airDate);
	
	                if (airDateMoment.isAfter(startDate) && airDateMoment.isBefore(endDate)) {
	                    return true;
	                }
	            }
	
	            return false;
	        });
	    },
	
	    _showHideEpisodes : function() {
	        if (this.showingEpisodes) {
	            this.showingEpisodes = false;
	            this.episodeGrid.close();
	        } else {
	            this.showingEpisodes = true;
	            this._showEpisodes();
	        }
	
	        this.templateHelpers.showingEpisodes = this.showingEpisodes;
	        this.render();
	    },
	
	    _episodeMonitoredToggled : function(options) {
	        var model = options.model;
	        var shiftKey = options.shiftKey;
	
	        if (!this.episodeCollection.get(model.get('id'))) {
	            return;
	        }
	
	        if (!shiftKey) {
	            return;
	        }
	
	        var lastToggled = this.episodeCollection.lastToggled;
	
	        if (!lastToggled) {
	            return;
	        }
	
	        var currentIndex = this.episodeCollection.indexOf(model);
	        var lastIndex = this.episodeCollection.indexOf(lastToggled);
	
	        var low = Math.min(currentIndex, lastIndex);
	        var high = Math.max(currentIndex, lastIndex);
	        var range = _.range(low + 1, high);
	
	        this.episodeCollection.lastToggled = model;
	    },
	
	    _updateEpisodeCollection : function() {
	        var self = this;
	
	        this.episodeCollection.add(this.fullEpisodeCollection.bySeason(this.model.get('seasonNumber')).models, { merge : true });
	
	        this.episodeCollection.each(function(model) {
	            model.episodeCollection = self.episodeCollection;
	        });
	    },
	
	    _refreshEpisodes : function() {
	        this._updateEpisodeCollection();
	        this.episodeCollection.fullCollection.sort();
	        this.render();
	    },
	
	    _openEpisodeFileEditor : function() {
	        var view = new EpisodeFileEditorLayout({
	            model             : this.model,
	            series            : this.series,
	            episodeCollection : this.episodeCollection
	        });
	
	        vent.trigger(vent.Commands.OpenModalCommand, view);
	    }
	});

/***/ },
/* 165 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var ToggleCell = __webpack_require__(166);
	var SeriesCollection = __webpack_require__(123);
	var Messenger = __webpack_require__(55);
	
	module.exports = ToggleCell.extend({
	    className : 'toggle-cell episode-monitored',
	
	    _originalOnClick : ToggleCell.prototype._onClick,
	
	    _onClick : function(e) {
	
	        var series = SeriesCollection.get(this.model.get('seriesId'));
	
	        if (!series.get('monitored')) {
	
	            Messenger.show({
	                message : 'Unable to change monitored state when series is not monitored',
	                type    : 'error'
	            });
	
	            return;
	        }
	
	        if (e.shiftKey && this.model.episodeCollection.lastToggled) {
	            this._selectRange();
	
	            return;
	        }
	
	        this._originalOnClick.apply(this, arguments);
	        this.model.episodeCollection.lastToggled = this.model;
	    },
	
	    _selectRange : function() {
	        var episodeCollection = this.model.episodeCollection;
	        var lastToggled = episodeCollection.lastToggled;
	
	        var currentIndex = episodeCollection.indexOf(this.model);
	        var lastIndex = episodeCollection.indexOf(lastToggled);
	
	        var low = Math.min(currentIndex, lastIndex);
	        var high = Math.max(currentIndex, lastIndex);
	        var range = _.range(low + 1, high);
	
	        _.each(range, function(index) {
	            var model = episodeCollection.at(index);
	
	            model.set('monitored', lastToggled.get('monitored'));
	            model.save();
	        });
	
	        this.model.set('monitored', lastToggled.get('monitored'));
	        this.model.save();
	        this.model.episodeCollection.lastToggled = undefined;
	    }
	});

/***/ },
/* 166 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'toggle-cell',
	
	    events : {
	        'click' : '_onClick'
	    },
	
	    _onClick : function() {
	
	        var self = this;
	
	        this.$el.tooltip('hide');
	
	        var name = this.column.get('name');
	        this.model.set(name, !this.model.get(name));
	
	        var promise = this.model.save();
	
	        this.$('i').spinForPromise(promise);
	
	        promise.always(function() {
	            self.render();
	        });
	    },
	
	    render : function() {
	        this.$el.empty();
	        this.$el.html('<i />');
	
	        var name = this.column.get('name');
	
	        if (this.model.get(name)) {
	            this.$('i').addClass(this.column.get('trueClass'));
	        } else {
	            this.$('i').addClass(this.column.get('falseClass'));
	        }
	
	        var tooltip = this.column.get('tooltip');
	
	        if (tooltip) {
	            this.$('i').attr('title', tooltip);
	        }
	
	        return this;
	    }
	});

/***/ },
/* 167 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-title-cell',
	
	    events : {
	        'click' : '_showDetails'
	    },
	
	    render : function() {
	        var title = this.cellValue.get('title');
	
	        if (!title || title === '') {
	            title = 'TBA';
	        }
	
	        this.$el.html(title);
	        return this;
	    },
	
	    _showDetails : function() {
	        var hideSeriesLink = this.column.get('hideSeriesLink');
	        vent.trigger(vent.Commands.ShowEpisodeDetails, {
	            episode        : this.cellValue,
	            hideSeriesLink : hideSeriesLink
	        });
	    }
	});

/***/ },
/* 168 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	var CommandController = __webpack_require__(86);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-actions-cell',
	
	    events : {
	        'click .x-automatic-search' : '_automaticSearch',
	        'click .x-manual-search'    : '_manualSearch'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        this.$el.html('<i class="icon-sonarr-search x-automatic-search" title="Automatic Search"></i>' + '<i class="icon-sonarr-search-manual x-manual-search" title="Manual Search"></i>');
	
	        CommandController.bindToCommand({
	            element : this.$el.find('.x-automatic-search'),
	            command : {
	                name       : 'episodeSearch',
	                episodeIds : [this.model.get('id')]
	            }
	        });
	
	        this.delegateEvents();
	        return this;
	    },
	
	    _automaticSearch : function() {
	        CommandController.Execute('episodeSearch', {
	            name       : 'episodeSearch',
	            episodeIds : [this.model.get('id')]
	        });
	    },
	
	    _manualSearch : function() {
	      console.warn(this.cellValue);
	        vent.trigger(vent.Commands.ShowEpisodeDetails, {
	            episode        : this.cellValue,
	            hideSeriesLink : true,
	            openingTab     : 'search'
	        });
	    }
	});


/***/ },
/* 169 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var SeriesCollection = __webpack_require__(123);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-warning-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.model.get('unverifiedSceneNumbering')) {
	            this.$el.html('<i class="icon-sonarr-form-warning" title="Scene number hasn\'t been verified yet."></i>');
	        }
	
	        else if (SeriesCollection.get(this.model.get('seriesId')).get('seriesType') === 'anime' && this.model.get('seasonNumber') > 0 && !this.model.has('absoluteEpisodeNumber')) {
	            this.$el.html('<i class="icon-sonarr-form-warning" title="Episode does not have an absolute episode number"></i>');
	        }
	
	        this.delegateEvents();
	        return this;
	    }
	});

/***/ },
/* 170 */
/***/ function(module, exports) {

	module.exports = function() {
	    this.prototype.appendHtml = function(collectionView, itemView, index) {
	        var childrenContainer = collectionView.itemViewContainer ? collectionView.$(collectionView.itemViewContainer) : collectionView.$el;
	        var collection = collectionView.collection;
	
	        // If the index of the model is at the end of the collection append, else insert at proper index
	        if (index >= collection.size() - 1) {
	            childrenContainer.append(itemView.el);
	        } else {
	            var previousModel = collection.at(index + 1);
	            var previousView = this.children.findByModel(previousModel);
	
	            if (previousView) {
	                previousView.$el.before(itemView.$el);
	            }
	
	            else {
	                childrenContainer.append(itemView.el);
	            }
	        }
	    };
	
	    return this;
	};

/***/ },
/* 171 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Series/Details/InfoViewTemplate',
	
	    initialize : function(options) {
	        this.episodeFileCollection = options.episodeFileCollection;
	
	        this.listenTo(this.model, 'change', this.render);
	        this.listenTo(this.episodeFileCollection, 'sync', this.render);
	    },
	
	    templateHelpers : function() {
	        return {
	            fileCount : this.episodeFileCollection.length
	        };
	    }
	});

/***/ },
/* 172 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneController = __webpack_require__(77);
	var AppLayout = __webpack_require__(70);
	var SeriesCollection = __webpack_require__(123);
	var SeriesIndexLayout = __webpack_require__(173);
	var SeriesDetailsLayout = __webpack_require__(158);
	
	module.exports = NzbDroneController.extend({
	    _originalInit : NzbDroneController.prototype.initialize,
	
	    initialize : function() {
	        //this.route('', this.series);
	        this.route('series', this.series);
	        this.route('series/:query', this.seriesDetails);
	         
	        this._originalInit.apply(this, arguments);
	    },
	
	    series : function() {
	        this.setTitle('Radarr');
	        this.showMainRegion(new SeriesIndexLayout());
	    },
	
	    seriesDetails : function(query) {
	        console.warn(AppLayout.mainRegion)
	         
	        var series = SeriesCollection.where({ titleSlug : query });
	         
	        if (series.length !== 0) {
	            var targetSeries = series[0];
	             
	            this.setTitle(targetSeries.get('title'));
	            this.showMainRegion(new SeriesDetailsLayout({ model : targetSeries }));
	        } else {
	            this.showNotFound();
	        }
	    }
	});


/***/ },
/* 173 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var PosterCollectionView = __webpack_require__(174);
	var ListCollectionView = __webpack_require__(177);
	var EmptyView = __webpack_require__(179);
	var SeriesCollection = __webpack_require__(123);
	var RelativeDateCell = __webpack_require__(127);
	var SeriesTitleCell = __webpack_require__(180);
	var TemplatedCell = __webpack_require__(95);
	var ProfileCell = __webpack_require__(98);
	var EpisodeProgressCell = __webpack_require__(181);
	var SeriesActionsCell = __webpack_require__(182);
	var SeriesStatusCell = __webpack_require__(183);
	var FooterView = __webpack_require__(184);
	var FooterModel = __webpack_require__(185);
	var ToolbarLayout = __webpack_require__(105);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Series/Index/SeriesIndexLayoutTemplate',
	
	    regions : {
	        seriesRegion : '#x-series',
	        toolbar      : '#x-toolbar',
	        toolbar2     : '#x-toolbar2',
	        footer       : '#x-series-footer'
	    },
	
	    columns : [
	        {
	            name  : 'statusWeight',
	            label : '',
	            cell  : SeriesStatusCell
	        },
	        {
	            name      : 'title',
	            label     : 'Title',
	            cell      : SeriesTitleCell,
	            cellValue : 'this',
	            sortValue : 'sortTitle'
	        },
	        {
	            name  : 'seasonCount',
	            label : 'Seasons',
	            cell  : 'integer'
	        },
	        {
	            name  : 'profileId',
	            label : 'Profile',
	            cell  : ProfileCell
	        },
	        {
	            name  : 'network',
	            label : 'Network',
	            cell  : 'string'
	        },
	        {
	            name  : 'nextAiring',
	            label : 'Next Airing',
	            cell  : RelativeDateCell
	        },
	        {
	            name      : 'percentOfEpisodes',
	            label     : 'Episodes',
	            cell      : EpisodeProgressCell,
	            className : 'episode-progress-cell'
	        },
	        {
	            name     : 'this',
	            label    : '',
	            sortable : false,
	            cell     : SeriesActionsCell
	        }
	    ],
	
	    leftSideButtons : {
	        type       : 'default',
	        storeState : false,
	        collapse   : true,
	        items      : [
	            {
	                title : 'Add Movie',
	                icon  : 'icon-sonarr-add',
	                route : 'addmovies'
	            },
	            {
	                title : 'Season Pass',
	                icon  : 'icon-sonarr-monitored',
	                route : 'seasonpass'
	            },
	            {
	                title : 'Series Editor',
	                icon  : 'icon-sonarr-edit',
	                route : 'serieseditor'
	            },
	            {
	                title        : 'RSS Sync',
	                icon         : 'icon-sonarr-rss',
	                command      : 'rsssync',
	                errorMessage : 'RSS Sync Failed!'
	            },
	            {
	                title          : 'Update Library',
	                icon           : 'icon-sonarr-refresh',
	                command        : 'refreshseries',
	                successMessage : 'Library was updated!',
	                errorMessage   : 'Library update failed!'
	            }
	        ]
	    },
	
	    initialize : function() {
	        this.seriesCollection = SeriesCollection.clone();
	        this.seriesCollection.shadowCollection.bindSignalR();
	
	        this.listenTo(this.seriesCollection.shadowCollection, 'sync', function(model, collection, options) {
	            this.seriesCollection.fullCollection.resetFiltered();
	            this._renderView();
	        });
	
	        this.listenTo(this.seriesCollection.shadowCollection, 'add', function(model, collection, options) {
	            this.seriesCollection.fullCollection.resetFiltered();
	            this._renderView();
	        });
	
	        this.listenTo(this.seriesCollection.shadowCollection, 'remove', function(model, collection, options) {
	            this.seriesCollection.fullCollection.resetFiltered();
	            this._renderView();
	        });
	
	        this.sortingOptions = {
	            type           : 'sorting',
	            storeState     : false,
	            viewCollection : this.seriesCollection,
	            items          : [
	                {
	                    title : 'Title',
	                    name  : 'title'
	                },
	                {
	                    title : 'Seasons',
	                    name  : 'seasonCount'
	                },
	                {
	                    title : 'Quality',
	                    name  : 'profileId'
	                },
	                {
	                    title : 'Network',
	                    name  : 'network'
	                },
	                {
	                    title : 'Next Airing',
	                    name  : 'nextAiring'
	                },
	                {
	                    title : 'Episodes',
	                    name  : 'percentOfEpisodes'
	                }
	            ]
	        };
	
	        this.filteringOptions = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'series.filterMode',
	            defaultAction : 'all',
	            items         : [
	                {
	                    key      : 'all',
	                    title    : '',
	                    tooltip  : 'All',
	                    icon     : 'icon-sonarr-all',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'monitored',
	                    title    : '',
	                    tooltip  : 'Monitored Only',
	                    icon     : 'icon-sonarr-monitored',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'continuing',
	                    title    : '',
	                    tooltip  : 'Continuing Only',
	                    icon     : 'icon-sonarr-series-continuing',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'ended',
	                    title    : '',
	                    tooltip  : 'Ended Only',
	                    icon     : 'icon-sonarr-series-ended',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'missing',
	                    title    : '',
	                    tooltip  : 'Missing',
	                    icon     : 'icon-sonarr-missing',
	                    callback : this._setFilter
	                }
	            ]
	        };
	
	        this.viewButtons = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'seriesViewMode',
	            defaultAction : 'listView',
	            items         : [
	                {
	                    key      : 'posterView',
	                    title    : '',
	                    tooltip  : 'Posters',
	                    icon     : 'icon-sonarr-view-poster',
	                    callback : this._showPosters
	                },
	                {
	                    key      : 'listView',
	                    title    : '',
	                    tooltip  : 'Overview List',
	                    icon     : 'icon-sonarr-view-list',
	                    callback : this._showList
	                },
	                {
	                    key      : 'tableView',
	                    title    : '',
	                    tooltip  : 'Table',
	                    icon     : 'icon-sonarr-view-table',
	                    callback : this._showTable
	                }
	            ]
	        };
	    },
	
	    onShow : function() {
	        this._showToolbar();
	        this._fetchCollection();
	    },
	
	    _showTable : function() {
	        this.currentView = new Backgrid.Grid({
	            collection : this.seriesCollection,
	            columns    : this.columns,
	            className  : 'table table-hover'
	        });
	
	        this._renderView();
	    },
	
	    _showList : function() {
	        this.currentView = new ListCollectionView({
	            collection : this.seriesCollection
	        });
	
	        this._renderView();
	    },
	
	    _showPosters : function() {
	        this.currentView = new PosterCollectionView({
	            collection : this.seriesCollection
	        });
	
	        this._renderView();
	    },
	
	    _renderView : function() {
	        if (SeriesCollection.length === 0) {
	            this.seriesRegion.show(new EmptyView());
	
	            this.toolbar.close();
	            this.toolbar2.close();
	        } else {
	            this.seriesRegion.show(this.currentView);
	
	            this._showToolbar();
	            this._showFooter();
	        }
	    },
	
	    _fetchCollection : function() {
	        this.seriesCollection.fetch();
	    },
	
	    _setFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        this.seriesCollection.setFilterMode(mode);
	    },
	
	    _showToolbar : function() {
	        if (this.toolbar.currentView) {
	            return;
	        }
	
	        this.toolbar2.show(new ToolbarLayout({
	            right   : [
	                this.filteringOptions
	            ],
	            context : this
	        }));
	
	        this.toolbar.show(new ToolbarLayout({
	            right   : [
	                this.sortingOptions,
	                this.viewButtons
	            ],
	            left    : [
	                this.leftSideButtons
	            ],
	            context : this
	        }));
	    },
	
	    _showFooter : function() {
	        var footerModel = new FooterModel();
	        var series = SeriesCollection.models.length;
	        var episodes = 0;
	        var episodeFiles = 0;
	        var ended = 0;
	        var continuing = 0;
	        var monitored = 0;
	
	        _.each(SeriesCollection.models, function(model) {
	            episodes += model.get('episodeCount');
	            episodeFiles += model.get('episodeFileCount');
	
	            if (model.get('status').toLowerCase() === 'ended') {
	                ended++;
	            } else {
	                continuing++;
	            }
	
	            if (model.get('monitored')) {
	                monitored++;
	            }
	        });
	
	        footerModel.set({
	            series       : series,
	            ended        : ended,
	            continuing   : continuing,
	            monitored    : monitored,
	            unmonitored  : series - monitored,
	            episodes     : episodes,
	            episodeFiles : episodeFiles
	        });
	
	        this.footer.show(new FooterView({ model : footerModel }));
	    }
	});


/***/ },
/* 174 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var PosterItemView = __webpack_require__(175);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : PosterItemView,
	    itemViewContainer : '#x-series-posters',
	    template          : 'Series/Index/Posters/SeriesPostersCollectionViewTemplate'
	});

/***/ },
/* 175 */
/***/ function(module, exports, __webpack_require__) {

	var SeriesIndexItemView = __webpack_require__(176);
	
	module.exports = SeriesIndexItemView.extend({
	    tagName  : 'li',
	    template : 'Series/Index/Posters/SeriesPostersItemViewTemplate',
	
	    initialize : function() {
	        this.events['mouseenter .x-series-poster-container'] = 'posterHoverAction';
	        this.events['mouseleave .x-series-poster-container'] = 'posterHoverAction';
	
	        this.ui.controls = '.x-series-controls';
	        this.ui.title = '.x-title';
	    },
	
	    posterHoverAction : function() {
	        this.ui.controls.slideToggle();
	        this.ui.title.slideToggle();
	    }
	});

/***/ },
/* 176 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var CommandController = __webpack_require__(86);
	
	module.exports = Marionette.ItemView.extend({
	    ui : {
	        refresh : '.x-refresh'
	    },
	
	    events : {
	        'click .x-edit'    : '_editSeries',
	        'click .x-refresh' : '_refreshSeries'
	    },
	
	    onRender : function() {
	        CommandController.bindToCommand({
	            element : this.ui.refresh,
	            command : {
	                name     : 'refreshSeries',
	                seriesId : this.model.get('id')
	            }
	        });
	    },
	
	    _editSeries : function() {
	        vent.trigger(vent.Commands.EditSeriesCommand, { series : this.model });
	    },
	
	    _refreshSeries : function() {
	        CommandController.Execute('refreshSeries', {
	            name     : 'refreshSeries',
	            seriesId : this.model.id
	        });
	    }
	});

/***/ },
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ListItemView = __webpack_require__(178);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : ListItemView,
	    itemViewContainer : '#x-series-list',
	    template          : 'Series/Index/Overview/SeriesOverviewCollectionViewTemplate'
	});

/***/ },
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var SeriesIndexItemView = __webpack_require__(176);
	
	module.exports = SeriesIndexItemView.extend({
	    template : 'Series/Index/Overview/SeriesOverviewItemViewTemplate'
	});

/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'Series/Index/EmptyTemplate'
	});

/***/ },
/* 180 */
/***/ function(module, exports, __webpack_require__) {

	var TemplatedCell = __webpack_require__(95);
	
	module.exports = TemplatedCell.extend({
	    className : 'series-title-cell',
	    template  : 'Cells/SeriesTitleTemplate'
	});

/***/ },
/* 181 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-progress-cell',
	    template  : 'Cells/EpisodeProgressCellTemplate',
	
	    render : function() {
	
	        var episodeCount = this.model.get('episodeCount');
	        var episodeFileCount = this.model.get('episodeFileCount');
	
	        var percent = 100;
	
	        if (episodeCount > 0) {
	            percent = episodeFileCount / episodeCount * 100;
	        }
	
	        this.model.set('percentOfEpisodes', percent);
	
	        this.templateFunction = Marionette.TemplateCache.get(this.template);
	        var data = this.model.toJSON();
	        var html = this.templateFunction(data);
	        this.$el.html(html);
	
	        return this;
	    }
	});


/***/ },
/* 182 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	var CommandController = __webpack_require__(86);
	
	module.exports = NzbDroneCell.extend({
	    className : 'series-actions-cell',
	
	    ui : {
	        refresh : '.x-refresh'
	    },
	
	    events : {
	        'click .x-edit'    : '_editSeries',
	        'click .x-refresh' : '_refreshSeries'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        this.$el.html('<i class="icon-sonarr-refresh x-refresh hidden-xs" title="" data-original-title="Update series info and scan disk"></i> ' +
	                      '<i class="icon-sonarr-edit x-edit" title="" data-original-title="Edit Series"></i>');
	
	        CommandController.bindToCommand({
	            element : this.$el.find('.x-refresh'),
	            command : {
	                name     : 'refreshSeries',
	                seriesId : this.model.get('id')
	            }
	        });
	
	        this.delegateEvents();
	        return this;
	    },
	
	    _editSeries : function() {
	        vent.trigger(vent.Commands.EditSeriesCommand, { series : this.model });
	    },
	
	    _refreshSeries : function() {
	        CommandController.Execute('refreshSeries', {
	            name     : 'refreshSeries',
	            seriesId : this.model.id
	        });
	    }
	});

/***/ },
/* 183 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'series-status-cell',
	
	    render : function() {
	        this.$el.empty();
	        var monitored = this.model.get('monitored');
	        var status = this.model.get('status');
	
	        if (status === 'ended') {
	            this.$el.html('<i class="icon-sonarr-series-ended grid-icon" title="Ended"></i>');
	            this._setStatusWeight(3);
	        }
	
	        else if (!monitored) {
	            this.$el.html('<i class="icon-sonarr-series-unmonitored grid-icon" title="Not Monitored"></i>');
	            this._setStatusWeight(2);
	        }
	
	        else {
	            this.$el.html('<i class="icon-sonarr-series-continuing grid-icon" title="Continuing"></i>');
	            this._setStatusWeight(1);
	        }
	
	        return this;
	    },
	
	    _setStatusWeight : function(weight) {
	        this.model.set('statusWeight', weight, { silent : true });
	    }
	});

/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'Series/Index/FooterViewTemplate'
	});

/***/ },
/* 185 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var _ = __webpack_require__(8);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 186 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Controller = __webpack_require__(187);
	
	module.exports = Marionette.AppRouter.extend({
	    controller : new Controller(),
	    appRoutes  : {
	        'addseries'                  : 'addSeries',
	        'addseries/:action(/:query)' : 'addSeries',
	        'addmovies'                  : 'addMovies',
	        'addmovies/:action(/:query)' : 'addMovies',
	        'calendar'                   : 'calendar',
	        'settings'                   : 'settings',
	        'settings/:action(/:query)'  : 'settings',
	        'wanted'                     : 'wanted',
	        'wanted/:action'             : 'wanted',
	        'history'                    : 'activity',
	        'history/:action'            : 'activity',
	        'activity'                   : 'activity',
	        'activity/:action'           : 'activity',
	        'rss'                        : 'rss',
	        'system'                     : 'system',
	        'system/:action'             : 'system',
	        'seasonpass'                 : 'seasonPass',
	        'movieeditor'                : 'movieEditor',
	        ':whatever'                  : 'showNotFound'
	    }
	});


/***/ },
/* 187 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneController = __webpack_require__(77);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var ActivityLayout = __webpack_require__(188);
	var SettingsLayout = __webpack_require__(208);
	var AddSeriesLayout = __webpack_require__(333);
	var AddMoviesLayout = __webpack_require__(350);
	var WantedLayout = __webpack_require__(366);
	var CalendarLayout = __webpack_require__(371);
	var ReleaseLayout = __webpack_require__(380);
	var SystemLayout = __webpack_require__(382);
	var SeasonPassLayout = __webpack_require__(430);
	var SeriesEditorLayout = __webpack_require__(433);
	var MovieEditorLayout = __webpack_require__(437);
	
	module.exports = NzbDroneController.extend({
	    addSeries : function(action) {
	        this.setTitle('Add Movie');
	        this.showMainRegion(new AddSeriesLayout({ action : action }));
	    },
	
	    addMovies : function(action) {
	      this.setTitle("Add Movie");
	      this.showMainRegion(new AddMoviesLayout({action : action}));
	    },
	
	    calendar : function() {
	        this.setTitle('Calendar');
	        this.showMainRegion(new CalendarLayout());
	    },
	
	    settings : function(action) {
	        this.setTitle('Settings');
	        this.showMainRegion(new SettingsLayout({ action : action }));
	    },
	
	    wanted : function(action) {
	        this.setTitle('Wanted');
	        this.showMainRegion(new WantedLayout({ action : action }));
	    },
	
	    activity : function(action) {
	        this.setTitle('Activity');
	        this.showMainRegion(new ActivityLayout({ action : action }));
	    },
	
	    rss : function() {
	        this.setTitle('RSS');
	        this.showMainRegion(new ReleaseLayout());
	    },
	
	    system : function(action) {
	        this.setTitle('System');
	        this.showMainRegion(new SystemLayout({ action : action }));
	    },
	
	    seasonPass : function() {
	        this.setTitle('Season Pass');
	        this.showMainRegion(new SeasonPassLayout());
	    },
	
	    seriesEditor : function() {
	        this.setTitle('Series Editor');
	        this.showMainRegion(new SeriesEditorLayout());
	    },
	
	    movieEditor : function() {
	        this.setTitle('Movie Editor');
	        this.showMainRegion(new MovieEditorLayout());
	    }
	});


/***/ },
/* 188 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backbone = __webpack_require__(6);
	var Backgrid = __webpack_require__(80);
	var HistoryLayout = __webpack_require__(189);
	var BlacklistLayout = __webpack_require__(196);
	var QueueLayout = __webpack_require__(202);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Activity/ActivityLayoutTemplate',
	
	    regions : {
	        queueRegion : '#queue',
	        history     : '#history',
	        blacklist   : '#blacklist'
	    },
	
	    ui : {
	        queueTab     : '.x-queue-tab',
	        historyTab   : '.x-history-tab',
	        blacklistTab : '.x-blacklist-tab'
	    },
	
	    events : {
	        'click .x-queue-tab'     : '_showQueue',
	        'click .x-history-tab'   : '_showHistory',
	        'click .x-blacklist-tab' : '_showBlacklist'
	    },
	
	    initialize : function(options) {
	        if (options.action) {
	            this.action = options.action.toLowerCase();
	        }
	    },
	
	    onShow : function() {
	        switch (this.action) {
	            case 'history':
	                this._showHistory();
	                break;
	            case 'blacklist':
	                this._showBlacklist();
	                break;
	            default:
	                this._showQueue();
	        }
	    },
	
	    _navigate : function(route) {
	        Backbone.history.navigate(route, {
	            trigger : false,
	            replace : true
	        });
	    },
	
	    _showHistory : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.history.show(new HistoryLayout());
	        this.ui.historyTab.tab('show');
	        this._navigate('/activity/history');
	    },
	
	    _showBlacklist : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.blacklist.show(new BlacklistLayout());
	        this.ui.blacklistTab.tab('show');
	        this._navigate('/activity/blacklist');
	    },
	
	    _showQueue : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.queueRegion.show(new QueueLayout());
	        this.ui.queueTab.tab('show');
	        this._navigate('/activity/queue');
	    }
	});

/***/ },
/* 189 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var HistoryCollection = __webpack_require__(133);
	var EventTypeCell = __webpack_require__(135);
	var MovieTitleCell = __webpack_require__(190);
	var EpisodeNumberCell = __webpack_require__(124);
	var EpisodeTitleCell = __webpack_require__(167);
	var HistoryQualityCell = __webpack_require__(191);
	var RelativeDateCell = __webpack_require__(127);
	var HistoryDetailsCell = __webpack_require__(192);
	var GridPager = __webpack_require__(193);
	var ToolbarLayout = __webpack_require__(105);
	var LoadingView = __webpack_require__(117);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Activity/History/HistoryLayoutTemplate',
	
	    regions : {
	        history : '#x-history',
	        toolbar : '#x-history-toolbar',
	        pager   : '#x-history-pager'
	    },
	
	    columns : [
	        {
	            name      : 'eventType',
	            label     : '',
	            cell      : EventTypeCell,
	            cellValue : 'this'
	        },
	        {
	            name  : 'movies',
	            label : 'Movie Title',
	            cell  : MovieTitleCell,
	        },
	        /*{
	            name     : 'episode',
	            label    : 'Episode',
	            cell     : EpisodeNumberCell,
	            sortable : false
	        },
	        {
	            name     : 'episode',
	            label    : 'Episode Title',
	            cell     : EpisodeTitleCell,
	            sortable : false
	        },*/
	        {
	            name     : 'this',
	            label    : 'Quality',
	            cell     : HistoryQualityCell,
	            sortable : false
	        },
	        {
	            name  : 'date',
	            label : 'Date',
	            cell  : RelativeDateCell
	        },
	        {
	            name     : 'this',
	            label    : '',
	            cell     : HistoryDetailsCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function() {
	        this.collection = new HistoryCollection({ tableName : 'history' });
	        this.listenTo(this.collection, 'sync', this._showTable);
	    },
	
	    onShow : function() {
	        this.history.show(new LoadingView());
	        this._showToolbar();
	    },
	
	    _showTable : function(collection) {
	
	        this.history.show(new Backgrid.Grid({
	            columns    : this.columns,
	            collection : collection,
	            className  : 'table table-hover'
	        }));
	
	        this.pager.show(new GridPager({
	            columns    : this.columns,
	            collection : collection
	        }));
	    },
	
	    _showToolbar : function() {
	        var filterOptions = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'history.filterMode',
	            defaultAction : 'all',
	            items         : [
	                {
	                    key      : 'all',
	                    title    : '',
	                    tooltip  : 'All',
	                    icon     : 'icon-sonarr-all',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'grabbed',
	                    title    : '',
	                    tooltip  : 'Grabbed',
	                    icon     : 'icon-sonarr-downloading',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'imported',
	                    title    : '',
	                    tooltip  : 'Imported',
	                    icon     : 'icon-sonarr-imported',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'failed',
	                    title    : '',
	                    tooltip  : 'Failed',
	                    icon     : 'icon-sonarr-download-failed',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'deleted',
	                    title    : '',
	                    tooltip  : 'Deleted',
	                    icon     : 'icon-sonarr-deleted',
	                    callback : this._setFilter
	                }
	            ]
	        };
	
	        this.toolbar.show(new ToolbarLayout({
	            right   : [
	                filterOptions
	            ],
	            context : this
	        }));
	    },
	
	    _setFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        this.collection.state.currentPage = 1;
	        var promise = this.collection.setFilterMode(mode);
	
	        if (buttonContext) {
	            buttonContext.ui.icon.spinForPromise(promise);
	        }
	    }
	});


/***/ },
/* 190 */
/***/ function(module, exports, __webpack_require__) {

	var TemplatedCell = __webpack_require__(95);
	
	module.exports = TemplatedCell.extend({
	    className : 'series-title-cell',
	    template  : 'Cells/SeriesTitleTemplate',
	
	
	        render : function() {
	           this.$el.html(this.model.get("movie").get("title")); //Hack, but somehow handlebar helper does not work.
	                    debugger;
	             return this;
	
	         }
	});


/***/ },
/* 191 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'history-quality-cell',
	
	    render : function() {
	
	        var title = '';
	        var quality = this.model.get('quality');
	        var revision = quality.revision;
	
	        if (revision.real && revision.real > 0) {
	            title += ' REAL';
	        }
	
	        if (revision.version && revision.version > 1) {
	            title += ' PROPER';
	        }
	
	        title = title.trim();
	
	        if (this.model.get('qualityCutoffNotMet')) {
	            this.$el.html('<span class="badge badge-inverse" title="{0}">{1}</span>'.format(title, quality.quality.name));
	        } else {
	            this.$el.html('<span class="badge" title="{0}">{1}</span>'.format(title, quality.quality.name));
	        }
	
	        return this;
	    }
	});


/***/ },
/* 192 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'history-details-cell',
	
	    events : {
	        'click' : '_showDetails'
	    },
	
	    render : function() {
	        this.$el.empty();
	        this.$el.html('<i class="icon-sonarr-info"></i>');
	
	        return this;
	    },
	
	    _showDetails : function() {
	        vent.trigger(vent.Commands.ShowHistoryDetails, { model : this.model });
	    }
	});

/***/ },
/* 193 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var Marionette = __webpack_require__(11);
	var Paginator = __webpack_require__(194);
	
	module.exports = Paginator.extend({
	    template : 'Shared/Grid/PagerTemplate',
	
	    events : {
	        'click .pager-btn'      : 'changePage',
	        'click .x-page-number'  : '_showPageJumper',
	        'change .x-page-select' : '_jumpToPage',
	        'blur .x-page-select'   : 'render'
	    },
	
	    windowSize : 1,
	
	    fastForwardHandleLabels : {
	        first : 'icon-sonarr-pager-first',
	        prev  : 'icon-sonarr-pager-previous',
	        next  : 'icon-sonarr-pager-next',
	        last  : 'icon-sonarr-pager-last'
	    },
	
	    changePage : function(e) {
	        e.preventDefault();
	
	        var target = this.$(e.target);
	
	        if (target.closest('li').hasClass('disabled')) {
	            return;
	        }
	
	        var icon = target.closest('li i');
	        var iconClasses = icon.attr('class').match(/(?:^|\s)icon\-.+?(?:$|\s)/);
	        var iconClass = $.trim(iconClasses[0]);
	
	        icon.removeClass(iconClass);
	        icon.addClass('icon-sonarr-spinner fa-spin');
	
	        var label = target.attr('data-action');
	        var ffLabels = this.fastForwardHandleLabels;
	
	        var collection = this.collection;
	
	        if (ffLabels) {
	            switch (label) {
	                case 'first':
	                    collection.getFirstPage();
	                    return;
	                case 'prev':
	                    if (collection.hasPrevious()) {
	                        collection.getPreviousPage();
	                    }
	                    return;
	                case 'next':
	                    if (collection.hasNext()) {
	                        collection.getNextPage();
	                    }
	                    return;
	                case 'last':
	                    collection.getLastPage();
	                    return;
	            }
	        }
	
	        var state = collection.state;
	        var pageIndex = target.text();
	        collection.getPage(state.firstPage === 0 ? pageIndex - 1 : pageIndex);
	    },
	
	    makeHandles : function() {
	        var handles = [];
	
	        var collection = this.collection;
	        var state = collection.state;
	
	        // convert all indices to 0-based here
	        var firstPage = state.firstPage;
	        var lastPage = +state.lastPage;
	        lastPage = Math.max(0, firstPage ? lastPage - 1 : lastPage);
	        var currentPage = Math.max(state.currentPage, state.firstPage);
	        currentPage = firstPage ? currentPage - 1 : currentPage;
	        var windowStart = Math.floor(currentPage / this.windowSize) * this.windowSize;
	        var windowEnd = Math.min(lastPage + 1, windowStart + this.windowSize);
	
	        if (collection.mode !== 'infinite') {
	            for (var i = windowStart; i < windowEnd; i++) {
	                handles.push({
	                    label      : i + 1,
	                    title      : 'No. ' + (i + 1),
	                    className  : currentPage === i ? 'active' : undefined,
	                    pageNumber : i + 1,
	                    lastPage   : lastPage + 1
	                });
	            }
	        }
	
	        var ffLabels = this.fastForwardHandleLabels;
	        if (ffLabels) {
	            if (ffLabels.prev) {
	                handles.unshift({
	                    label     : ffLabels.prev,
	                    className : collection.hasPrevious() ? void 0 : 'disabled',
	                    action    : 'prev'
	                });
	            }
	
	            if (ffLabels.first) {
	                handles.unshift({
	                    label     : ffLabels.first,
	                    className : collection.hasPrevious() ? void 0 : 'disabled',
	                    action    : 'first'
	                });
	            }
	
	            if (ffLabels.next) {
	                handles.push({
	                    label     : ffLabels.next,
	                    className : collection.hasNext() ? void 0 : 'disabled',
	                    action    : 'next'
	                });
	            }
	
	            if (ffLabels.last) {
	                handles.push({
	                    label     : ffLabels.last,
	                    className : collection.hasNext() ? void 0 : 'disabled',
	                    action    : 'last'
	                });
	            }
	        }
	
	        return handles;
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        var templateFunction = Marionette.TemplateCache.get(this.template);
	
	        this.$el.html(templateFunction({
	            handles : this.makeHandles(),
	            state   : this.collection.state
	        }));
	
	        this.delegateEvents();
	
	        return this;
	    },
	
	    _showPageJumper : function(e) {
	        if ($(e.target).is('select')) {
	            return;
	        }
	
	        var templateFunction = Marionette.TemplateCache.get('Shared/Grid/JumpToPageTemplate');
	        var state = this.collection.state;
	        var currentPage = Math.max(state.currentPage, state.firstPage);
	        currentPage = state.firstPage ? currentPage - 1 : currentPage;
	
	        var pages = [];
	
	        for (var i = 0; i < this.collection.state.lastPage; i++) {
	            if (i === currentPage) {
	                pages.push({
	                    page    : i + 1,
	                    current : true
	                });
	            } else {
	                pages.push({ page : i + 1 });
	            }
	        }
	
	        this.$el.find('.x-page-number').html(templateFunction({ pages : pages }));
	    },
	
	    _jumpToPage : function() {
	        var target = this.$el.find('.x-page-select');
	
	        //Remove event handlers so the blur event is not triggered
	        this.undelegateEvents();
	
	        var selectedPage = parseInt(target.val(), 10);
	
	        this.$el.find('.x-page-number').html('<i class="icon-sonarr-spinner fa-spin"></i>');
	        this.collection.getPage(selectedPage);
	    }
	});

/***/ },
/* 194 */,
/* 195 */,
/* 196 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var BlacklistCollection = __webpack_require__(197);
	var SeriesTitleCell = __webpack_require__(180);
	var QualityCell = __webpack_require__(136);
	var RelativeDateCell = __webpack_require__(127);
	var BlacklistActionsCell = __webpack_require__(199);
	var GridPager = __webpack_require__(193);
	var LoadingView = __webpack_require__(117);
	var ToolbarLayout = __webpack_require__(105);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Activity/Blacklist/BlacklistLayoutTemplate',
	
	    regions : {
	        blacklist : '#x-blacklist',
	        toolbar   : '#x-toolbar',
	        pager     : '#x-pager'
	    },
	
	    columns : [
	        {
	            name  : 'series',
	            label : 'Series',
	            cell  : SeriesTitleCell
	        },
	        {
	            name  : 'sourceTitle',
	            label : 'Source Title',
	            cell  : 'string'
	        },
	        {
	            name     : 'quality',
	            label    : 'Quality',
	            cell     : QualityCell,
	            sortable : false
	        },
	        {
	            name  : 'date',
	            label : 'Date',
	            cell  : RelativeDateCell
	        },
	        {
	            name     : 'this',
	            label    : '',
	            cell     : BlacklistActionsCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function() {
	        this.collection = new BlacklistCollection({ tableName : 'blacklist' });
	
	        this.listenTo(this.collection, 'sync', this._showTable);
	        this.listenTo(vent, vent.Events.CommandComplete, this._commandComplete);
	    },
	
	    onShow : function() {
	        this.blacklist.show(new LoadingView());
	        this._showToolbar();
	        this.collection.fetch();
	    },
	
	    _showTable : function(collection) {
	
	        this.blacklist.show(new Backgrid.Grid({
	            columns    : this.columns,
	            collection : collection,
	            className  : 'table table-hover'
	        }));
	
	        this.pager.show(new GridPager({
	            columns    : this.columns,
	            collection : collection
	        }));
	    },
	
	    _showToolbar : function() {
	        var leftSideButtons = {
	            type       : 'default',
	            storeState : false,
	            items      : [
	                {
	                    title   : 'Clear Blacklist',
	                    icon    : 'icon-sonarr-clear',
	                    command : 'clearBlacklist'
	                }
	            ]
	        };
	
	        this.toolbar.show(new ToolbarLayout({
	            left    : [
	                leftSideButtons
	            ],
	            context : this
	        }));
	    },
	
	    _refreshTable : function(buttonContext) {
	        this.collection.state.currentPage = 1;
	        var promise = this.collection.fetch({ reset : true });
	
	        if (buttonContext) {
	            buttonContext.ui.icon.spinForPromise(promise);
	        }
	    },
	
	    _commandComplete : function(options) {
	        if (options.command.get('name') === 'clearblacklist') {
	            this._refreshTable();
	        }
	    }
	});


/***/ },
/* 197 */
/***/ function(module, exports, __webpack_require__) {

	var BlacklistModel = __webpack_require__(198);
	var PageableCollection = __webpack_require__(29);
	var AsSortedCollection = __webpack_require__(34);
	var AsPersistedStateCollection = __webpack_require__(66);
	
	var Collection = PageableCollection.extend({
	    url   : window.NzbDrone.ApiRoot + '/blacklist',
	    model : BlacklistModel,
	
	    state : {
	        pageSize : 15,
	        sortKey  : 'date',
	        order    : 1
	    },
	
	    queryParams : {
	        totalPages   : null,
	        totalRecords : null,
	        pageSize     : 'pageSize',
	        sortKey      : 'sortKey',
	        order        : 'sortDir',
	        directions   : {
	            '-1' : 'asc',
	            '1'  : 'desc'
	        }
	    },
	
	    sortMappings : {
	        'series' : { sortKey : 'series.sortTitle' }
	    },
	
	    parseState : function(resp) {
	        return { totalRecords : resp.totalRecords };
	    },
	
	    parseRecords : function(resp) {
	        if (resp) {
	            return resp.records;
	        }
	
	        return resp;
	    }
	});
	Collection = AsSortedCollection.call(Collection);
	Collection = AsPersistedStateCollection.call(Collection);
	
	module.exports = Collection;

/***/ },
/* 198 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var SeriesCollection = __webpack_require__(123);
	
	module.exports = Backbone.Model.extend({
	
	    //Hack to deal with Backbone 1.0's bug
	    initialize : function() {
	        this.url = function() {
	            return this.collection.url + '/' + this.get('id');
	        };
	    },
	
	    parse : function(model) {
	        model.series = SeriesCollection.get(model.seriesId);
	        return model;
	    }
	});

/***/ },
/* 199 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	var BlacklistDetailsLayout = __webpack_require__(200);
	
	module.exports = NzbDroneCell.extend({
	    className : 'blacklist-actions-cell',
	
	    events : {
	        'click .x-details' : '_details',
	        'click .x-delete'  : '_delete'
	    },
	
	    render : function() {
	        this.$el.empty();
	        this.$el.html('<i class="icon-sonarr-info x-details"></i>' +
	                      '<i class="icon-sonarr-delete x-delete"></i>');
	
	        return this;
	    },
	
	    _details : function() {
	        vent.trigger(vent.Commands.OpenModalCommand, new BlacklistDetailsLayout({ model : this.model }));
	    },
	
	    _delete : function() {
	        this.model.destroy();
	    }
	});


/***/ },
/* 200 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var BlacklistDetailsView = __webpack_require__(201);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Activity/Blacklist/Details/BlacklistDetailsLayoutTemplate',
	
	    regions : {
	        bodyRegion : '.modal-body'
	    },
	
	    onShow : function() {
	        this.bodyRegion.show(new BlacklistDetailsView({ model : this.model }));
	    }
	});

/***/ },
/* 201 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Activity/Blacklist/Details/BlacklistDetailsViewTemplate'
	});

/***/ },
/* 202 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var QueueCollection = __webpack_require__(28);
	var SeriesTitleCell = __webpack_require__(97);
	var EpisodeNumberCell = __webpack_require__(124);
	var EpisodeTitleCell = __webpack_require__(167);
	var QualityCell = __webpack_require__(136);
	var QueueStatusCell = __webpack_require__(203);
	var QueueActionsCell = __webpack_require__(204);
	var TimeleftCell = __webpack_require__(206);
	var ProgressCell = __webpack_require__(207);
	var ProtocolCell = __webpack_require__(151);
	var GridPager = __webpack_require__(193);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Activity/Queue/QueueLayoutTemplate',
	
	    regions : {
	        table : '#x-queue',
	        pager : '#x-queue-pager'
	    },
	
	    columns : [
	        {
	            name      : 'status',
	            label     : '',
	            cell      : QueueStatusCell,
	            cellValue : 'this'
	        },
	        {
	            name     : 'movie',
	            label    : 'Movie',
	            cell     : SeriesTitleCell
	        },
	        /*{
	            name     : 'episode',
	            label    : 'Episode',
	            cell     : EpisodeNumberCell
	        },
	        {
	            name      : 'episodeTitle',
	            label     : 'Episode Title',
	            cell      : EpisodeTitleCell,
	            cellValue : 'episode'
	        },*/
	        {
	            name     : 'quality',
	            label    : 'Quality',
	            cell     : QualityCell,
	            sortable : false
	        },
	        {
	            name  : 'protocol',
	            label : 'Protocol',
	            cell  : ProtocolCell
	        },
	        {
	            name      : 'timeleft',
	            label     : 'Time Left',
	            cell      : TimeleftCell,
	            cellValue : 'this'
	        },
	        {
	            name      : 'sizeleft',
	            label     : 'Progress',
	            cell      : ProgressCell,
	            cellValue : 'this'
	        },
	        {
	            name      : 'status',
	            label     : '',
	            cell      : QueueActionsCell,
	            cellValue : 'this'
	        }
	    ],
	
	    initialize : function() {
	        this.listenTo(QueueCollection, 'sync', this._showTable);
	    },
	
	    onShow : function() {
	        this._showTable();
	    },
	
	    _showTable : function() {
	        this.table.show(new Backgrid.Grid({
	            columns    : this.columns,
	            collection : QueueCollection,
	            className  : 'table table-hover'
	        }));
	
	        this.pager.show(new GridPager({
	            columns    : this.columns,
	            collection : QueueCollection
	        }));
	    }
	});


/***/ },
/* 203 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'queue-status-cell',
	    template  : 'Activity/Queue/QueueStatusCellTemplate',
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.cellValue) {
	            var status = this.cellValue.get('status').toLowerCase();
	            var trackedDownloadStatus = this.cellValue.has('trackedDownloadStatus') ? this.cellValue.get('trackedDownloadStatus').toLowerCase() : 'ok';
	            var icon = 'icon-sonarr-downloading';
	            var title = 'Downloading';
	            var itemTitle = this.cellValue.get('title');
	            var content = itemTitle;
	
	            if (status === 'paused') {
	                icon = 'icon-sonarr-paused';
	                title = 'Paused';
	            }
	
	            if (status === 'queued') {
	                icon = 'icon-sonarr-queued';
	                title = 'Queued';
	            }
	
	            if (status === 'completed') {
	                icon = 'icon-sonarr-downloaded';
	                title = 'Downloaded';
	            }
	
	            if (status === 'pending') {
	                icon = 'icon-sonarr-pending';
	                title = 'Pending';
	            }
	
	            if (status === 'failed') {
	                icon = 'icon-sonarr-download-failed';
	                title = 'Download failed';
	            }
	
	            if (status === 'warning') {
	                icon = 'icon-sonarr-download-warning';
	                title = 'Download warning: check download client for more details';
	            }
	
	            if (trackedDownloadStatus === 'warning') {
	                icon += ' icon-sonarr-warning';
	
	                this.templateFunction = Marionette.TemplateCache.get(this.template);
	                content = this.templateFunction(this.cellValue.toJSON());
	            }
	
	            if (trackedDownloadStatus === 'error') {
	                if (status === 'completed') {
	                    icon = 'icon-sonarr-import-failed';
	                    title = 'Import failed: ' + itemTitle;
	                } else {
	                    icon = 'icon-sonarr-download-failed';
	                    title = 'Download failed';
	                }
	
	                this.templateFunction = Marionette.TemplateCache.get(this.template);
	                content = this.templateFunction(this.cellValue.toJSON());
	            }
	
	            this.$el.html('<i class="{0}"></i>'.format(icon));
	            this.$el.popover({
	                content   : content,
	                html      : true,
	                trigger   : 'hover',
	                title     : title,
	                placement : 'right',
	                container : this.$el
	            });
	        }
	        return this;
	    }
	});

/***/ },
/* 204 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var TemplatedCell = __webpack_require__(95);
	var RemoveFromQueueView = __webpack_require__(205);
	
	module.exports = TemplatedCell.extend({
	
	    template  : 'Activity/Queue/QueueActionsCellTemplate',
	    className : 'queue-actions-cell',
	
	    events : {
	        'click .x-remove'        : '_remove',
	        'click .x-manual-import' : '_manualImport',
	        'click .x-grab'          : '_grab'
	    },
	
	    ui : {
	        import : '.x-import',
	        grab   : '.x-grab'
	    },
	
	    _remove : function() {
	        var showBlacklist = this.model.get('status') !== 'Pending';
	
	        vent.trigger(vent.Commands.OpenModalCommand, new RemoveFromQueueView({
	            model         : this.model,
	            showBlacklist : showBlacklist
	        }));
	    },
	
	    _manualImport : function () {
	        vent.trigger(vent.Commands.ShowManualImport,
	            {
	                downloadId: this.model.get('downloadId'),
	                title: this.model.get('title')
	            });
	    },
	
	    _grab : function() {
	        var self = this;
	        var data = _.omit(this.model.toJSON(), 'series', 'episode');
	
	        var promise = $.ajax({
	            url  : window.NzbDrone.ApiRoot + '/queue/grab',
	            type : 'POST',
	            data : JSON.stringify(data)
	        });
	
	        this.$(this.ui.grab).spinForPromise(promise);
	
	        promise.success(function() {
	            //find models that have the same series id and episode ids and remove them
	            self.model.trigger('destroy', self.model);
	        });
	    }
	});


/***/ },
/* 205 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Activity/Queue/RemoveFromQueueViewTemplate',
	
	    events : {
	        'click .x-confirm-remove' : 'removeItem'
	    },
	
	    ui : {
	        blacklist : '.x-blacklist',
	        indicator : '.x-indicator'
	    },
	
	    initialize : function(options) {
	        this.templateHelpers = {
	            showBlacklist : options.showBlacklist
	        };
	    },
	
	    removeItem : function() {
	        var blacklist = this.ui.blacklist.prop('checked') || false;
	
	        this.ui.indicator.show();
	
	        this.model.destroy({
	            data : { 'blacklist' : blacklist },
	            wait : true
	        }).done(function() {
	            vent.trigger(vent.Commands.CloseModalCommand);
	        });
	    }
	});


/***/ },
/* 206 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var moment = __webpack_require__(17);
	var UiSettingsModel = __webpack_require__(22);
	var FormatHelpers = __webpack_require__(20);
	
	module.exports = NzbDroneCell.extend({
	    className : 'timeleft-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.cellValue) {
	            if (this.cellValue.get('status').toLowerCase() === 'pending') {
	                var ect = this.cellValue.get('estimatedCompletionTime');
	                var time = '{0} at {1}'.format(FormatHelpers.relativeDate(ect), moment(ect).format(UiSettingsModel.time(true, false)));
	                this.$el.html('<div title="Delaying download till {0}">-</div>'.format(time));
	                return this;
	            }
	
	            var timeleft = this.cellValue.get('timeleft');
	            var totalSize = FormatHelpers.bytes(this.cellValue.get('size'), 2);
	            var remainingSize = FormatHelpers.bytes(this.cellValue.get('sizeleft'), 2);
	
	            if (timeleft === undefined) {
	                this.$el.html('-');
	            } else {
	                this.$el.html('<span title="{1} / {2}">{0}</span>'.format(timeleft, remainingSize, totalSize));
	            }
	        }
	
	        return this;
	    }
	});

/***/ },
/* 207 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'progress-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.cellValue) {
	
	            var status = this.model.get('status').toLowerCase();
	
	            if (status === 'downloading') {
	                var progress = 100 - (this.model.get('sizeleft') / this.model.get('size') * 100);
	
	                this.$el.html('<div class="progress" title="{0}%">'.format(progress.toFixed(1)) +
	                              '<div class="progress-bar progress-bar-purple" style="width: {0}%;"></div></div>'.format(progress));
	            }
	        }
	
	        return this;
	    }
	});


/***/ },
/* 208 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backbone = __webpack_require__(6);
	var GeneralSettingsModel = __webpack_require__(209);
	var NamingModel = __webpack_require__(212);
	var MediaManagementLayout = __webpack_require__(213);
	var MediaManagementSettingsModel = __webpack_require__(237);
	var ProfileLayout = __webpack_require__(238);
	var QualityLayout = __webpack_require__(264);
	var IndexerLayout = __webpack_require__(270);
	var IndexerCollection = __webpack_require__(271);
	var IndexerSettingsModel = __webpack_require__(293);
	var DownloadClientLayout = __webpack_require__(294);
	var DownloadClientSettingsModel = __webpack_require__(312);
	var NotificationCollectionView = __webpack_require__(313);
	var NotificationCollection = __webpack_require__(318);
	var MetadataLayout = __webpack_require__(322);
	var GeneralView = __webpack_require__(328);
	var UiView = __webpack_require__(331);
	var UiSettingsModel = __webpack_require__(332);
	var LoadingView = __webpack_require__(117);
	var Config = __webpack_require__(35);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Settings/SettingsLayoutTemplate',
	
	    regions : {
	        mediaManagement : '#media-management',
	        profiles        : '#profiles',
	        quality         : '#quality',
	        indexers        : '#indexers',
	        downloadClient  : '#download-client',
	        notifications   : '#notifications',
	        metadata        : '#metadata',
	        general         : '#general',
	        uiRegion        : '#ui',
	        loading         : '#loading-region'
	    },
	
	    ui : {
	        mediaManagementTab : '.x-media-management-tab',
	        profilesTab        : '.x-profiles-tab',
	        qualityTab         : '.x-quality-tab',
	        indexersTab        : '.x-indexers-tab',
	        downloadClientTab  : '.x-download-client-tab',
	        notificationsTab   : '.x-notifications-tab',
	        metadataTab        : '.x-metadata-tab',
	        generalTab         : '.x-general-tab',
	        uiTab              : '.x-ui-tab',
	        advancedSettings   : '.x-advanced-settings'
	    },
	
	    events : {
	        'click .x-media-management-tab' : '_showMediaManagement',
	        'click .x-profiles-tab'         : '_showProfiles',
	        'click .x-quality-tab'          : '_showQuality',
	        'click .x-indexers-tab'         : '_showIndexers',
	        'click .x-download-client-tab'  : '_showDownloadClient',
	        'click .x-notifications-tab'    : '_showNotifications',
	        'click .x-metadata-tab'         : '_showMetadata',
	        'click .x-general-tab'          : '_showGeneral',
	        'click .x-ui-tab'               : '_showUi',
	        'click .x-save-settings'        : '_save',
	        'change .x-advanced-settings'   : '_toggleAdvancedSettings'
	    },
	
	    initialize : function(options) {
	        if (options.action) {
	            this.action = options.action.toLowerCase();
	        }
	
	        this.listenTo(vent, vent.Hotkeys.SaveSettings, this._save);
	    },
	
	    onRender : function() {
	        this.loading.show(new LoadingView());
	        var self = this;
	
	        this.mediaManagementSettings = new MediaManagementSettingsModel();
	        this.namingSettings = new NamingModel();
	        this.indexerSettings = new IndexerSettingsModel();
	        this.downloadClientSettings = new DownloadClientSettingsModel();
	        this.notificationCollection = new NotificationCollection();
	        this.generalSettings = new GeneralSettingsModel();
	        this.uiSettings = new UiSettingsModel();
	        Backbone.$.when(this.mediaManagementSettings.fetch(), this.namingSettings.fetch(), this.indexerSettings.fetch(), this.downloadClientSettings.fetch(),
	            this.notificationCollection.fetch(), this.generalSettings.fetch(), this.uiSettings.fetch()).done(function() {
	                if (!self.isClosed) {
	                    self.loading.$el.hide();
	                    self.mediaManagement.show(new MediaManagementLayout({
	                        settings       : self.mediaManagementSettings,
	                        namingSettings : self.namingSettings
	                    }));
	                    self.profiles.show(new ProfileLayout());
	                    self.quality.show(new QualityLayout());
	                    self.indexers.show(new IndexerLayout({ model : self.indexerSettings }));
	                    self.downloadClient.show(new DownloadClientLayout({ model : self.downloadClientSettings }));
	                    self.notifications.show(new NotificationCollectionView({ collection : self.notificationCollection }));
	                    self.metadata.show(new MetadataLayout());
	                    self.general.show(new GeneralView({ model : self.generalSettings }));
	                    self.uiRegion.show(new UiView({ model : self.uiSettings }));
	                }
	            });
	
	        this._setAdvancedSettingsState();
	    },
	
	    onShow : function() {
	        switch (this.action) {
	            case 'profiles':
	                this._showProfiles();
	                break;
	            case 'quality':
	                this._showQuality();
	                break;
	            case 'indexers':
	                this._showIndexers();
	                break;
	            case 'downloadclient':
	                this._showDownloadClient();
	                break;
	            case 'connect':
	                this._showNotifications();
	                break;
	            case 'notifications':
	                this._showNotifications();
	                break;
	            case 'metadata':
	                this._showMetadata();
	                break;
	            case 'general':
	                this._showGeneral();
	                break;
	            case 'ui':
	                this._showUi();
	                break;
	            default:
	                this._showMediaManagement();
	        }
	    },
	
	    _showMediaManagement : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.mediaManagementTab.tab('show');
	        this._navigate('settings/mediamanagement');
	    },
	
	    _showProfiles : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.profilesTab.tab('show');
	        this._navigate('settings/profiles');
	    },
	
	    _showQuality : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.qualityTab.tab('show');
	        this._navigate('settings/quality');
	    },
	
	    _showIndexers : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.indexersTab.tab('show');
	        this._navigate('settings/indexers');
	    },
	
	    _showDownloadClient : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.downloadClientTab.tab('show');
	        this._navigate('settings/downloadclient');
	    },
	
	    _showNotifications : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.notificationsTab.tab('show');
	        this._navigate('settings/connect');
	    },
	
	    _showMetadata : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	        this.ui.metadataTab.tab('show');
	        this._navigate('settings/metadata');
	    },
	
	    _showGeneral : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	        this.ui.generalTab.tab('show');
	        this._navigate('settings/general');
	    },
	
	    _showUi : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	        this.ui.uiTab.tab('show');
	        this._navigate('settings/ui');
	    },
	
	    _navigate : function(route) {
	        Backbone.history.navigate(route, {
	            trigger : false,
	            replace : true
	        });
	    },
	
	    _save : function() {
	        vent.trigger(vent.Commands.SaveSettings);
	    },
	
	    _setAdvancedSettingsState : function() {
	        var checked = Config.getValueBoolean(Config.Keys.AdvancedSettings);
	        this.ui.advancedSettings.prop('checked', checked);
	
	        if (checked) {
	            $('body').addClass('show-advanced-settings');
	        }
	    },
	
	    _toggleAdvancedSettings : function() {
	        var checked = this.ui.advancedSettings.prop('checked');
	        Config.setValue(Config.Keys.AdvancedSettings, checked);
	
	        if (checked) {
	            $('body').addClass('show-advanced-settings');
	        } else {
	            $('body').removeClass('show-advanced-settings');
	        }
	    }
	});

/***/ },
/* 209 */
/***/ function(module, exports, __webpack_require__) {

	var SettingsModelBase = __webpack_require__(210);
	
	module.exports = SettingsModelBase.extend({
	    url            : window.NzbDrone.ApiRoot + '/config/host',
	    successMessage : 'General settings saved',
	    errorMessage   : 'Failed to save general settings'
	});

/***/ },
/* 210 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var DeepModel = __webpack_require__(46);
	var AsChangeTrackingModel = __webpack_require__(211);
	var Messenger = __webpack_require__(55);
	
	var model = DeepModel.extend({
	
	    initialize : function() {
	        this.listenTo(vent, vent.Commands.SaveSettings, this.saveSettings);
	        this.listenTo(this, 'destroy', this._stopListening);
	    },
	
	    saveSettings : function() {
	        if (!this.isSaved) {
	            var savePromise = this.save();
	
	            Messenger.monitor({
	                promise        : savePromise,
	                successMessage : this.successMessage,
	                errorMessage   : this.errorMessage
	            });
	
	            return savePromise;
	        }
	
	        return undefined;
	    },
	
	    _stopListening : function() {
	        this.stopListening(vent, vent.Commands.SaveSettings);
	    }
	});
	
	module.exports = AsChangeTrackingModel.call(model);


/***/ },
/* 211 */
/***/ function(module, exports) {

	module.exports = function() {
	    var originalInit = this.prototype.initialize;
	
	    this.prototype.initialize = function() {
	
	        this.isSaved = true;
	
	        this.on('change', function() {
	            this.isSaved = false;
	        }, this);
	
	        this.on('sync', function() {
	            this.isSaved = true;
	        }, this);
	
	        if (originalInit) {
	            originalInit.call(this);
	        }
	    };
	
	    return this;
	};

/***/ },
/* 212 */
/***/ function(module, exports, __webpack_require__) {

	var ModelBase = __webpack_require__(210);
	
	module.exports = ModelBase.extend({
	    url            : window.NzbDrone.ApiRoot + '/config/naming',
	    successMessage : 'MediaManagement settings saved',
	    errorMessage   : 'Couldn\'t save naming settings'
	});

/***/ },
/* 213 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var NamingView = __webpack_require__(214);
	var SortingView = __webpack_require__(224);
	var FileManagementView = __webpack_require__(225);
	var PermissionsView = __webpack_require__(236);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Settings/MediaManagement/MediaManagementLayoutTemplate',
	
	    regions : {
	        episodeNaming  : '#episode-naming',
	        sorting        : '#sorting',
	        fileManagement : '#file-management',
	        permissions    : '#permissions'
	    },
	
	    initialize : function(options) {
	        this.settings = options.settings;
	        this.namingSettings = options.namingSettings;
	    },
	
	    onShow : function() {
	        this.episodeNaming.show(new NamingView({ model : this.namingSettings }));
	        this.sorting.show(new SortingView({ model : this.settings }));
	        this.fileManagement.show(new FileManagementView({ model : this.settings }));
	        this.permissions.show(new PermissionsView({ model : this.settings }));
	    }
	});

/***/ },
/* 214 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var NamingSampleModel = __webpack_require__(215);
	var BasicNamingView = __webpack_require__(216);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	
	module.exports = (function() {
	    var view = Marionette.Layout.extend({
	        template                            : 'Settings/MediaManagement/Naming/NamingViewTemplate',
	        ui                                  : {
	            namingOptions            : '.x-naming-options',
	            renameEpisodesCheckbox   : '.x-rename-episodes',
	            singleEpisodeExample     : '.x-single-episode-example',
	            multiEpisodeExample      : '.x-multi-episode-example',
	            dailyEpisodeExample      : '.x-daily-episode-example',
	            animeEpisodeExample      : '.x-anime-episode-example',
	            animeMultiEpisodeExample : '.x-anime-multi-episode-example',
	            namingTokenHelper        : '.x-naming-token-helper',
	            multiEpisodeStyle        : '.x-multi-episode-style',
	            seriesFolderExample      : '.x-series-folder-example',
	            seasonFolderExample      : '.x-season-folder-example',
	            movieExample             : '.x-movie-example',
	            movieFolderExample       : '.x-movie-folder-example'
	        },
	        events                              : {
	            "change .x-rename-episodes"      : '_setFailedDownloadOptionsVisibility',
	            "click .x-show-wizard"           : '_showWizard',
	            "click .x-naming-token-helper a" : '_addToken',
	            "change .x-multi-episode-style"  : '_multiEpisodeFomatChanged'
	        },
	        regions                             : { basicNamingRegion : '.x-basic-naming' },
	        onRender                            : function() {
	            if (!this.model.get('renameEpisodes')) {
	                this.ui.namingOptions.hide();
	            }
	            var basicNamingView = new BasicNamingView({ model : this.model });
	            this.basicNamingRegion.show(basicNamingView);
	            this.namingSampleModel = new NamingSampleModel();
	            this.listenTo(this.model, 'change', this._updateSamples);
	            this.listenTo(this.namingSampleModel, 'sync', this._showSamples);
	            this._updateSamples();
	        },
	        _setFailedDownloadOptionsVisibility : function() {
	            var checked = this.ui.renameEpisodesCheckbox.prop('checked');
	            if (checked) {
	                this.ui.namingOptions.slideDown();
	            } else {
	                this.ui.namingOptions.slideUp();
	            }
	        },
	        _updateSamples                      : function() {
	            this.namingSampleModel.fetch({ data : this.model.toJSON() });
	        },
	        _showSamples                        : function() {
	            this.ui.singleEpisodeExample.html(this.namingSampleModel.get('singleEpisodeExample'));
	            this.ui.multiEpisodeExample.html(this.namingSampleModel.get('multiEpisodeExample'));
	            this.ui.dailyEpisodeExample.html(this.namingSampleModel.get('dailyEpisodeExample'));
	            this.ui.animeEpisodeExample.html(this.namingSampleModel.get('animeEpisodeExample'));
	            this.ui.animeMultiEpisodeExample.html(this.namingSampleModel.get('animeMultiEpisodeExample'));
	            this.ui.seriesFolderExample.html(this.namingSampleModel.get('seriesFolderExample'));
	            this.ui.seasonFolderExample.html(this.namingSampleModel.get('seasonFolderExample'));
	            this.ui.movieExample.html(this.namingSampleModel.get('movieExample'));
	            this.ui.movieFolderExample.html(this.namingSampleModel.get('movieFolderExample'));
	        },
	        _addToken                           : function(e) {
	            e.preventDefault();
	            e.stopPropagation();
	            var target = e.target;
	            var token = '';
	            var input = this.$(target).closest('.x-helper-input').children('input');
	            if (this.$(target).attr('data-token')) {
	                token = '{{0}}'.format(this.$(target).attr('data-token'));
	            } else {
	                token = this.$(target).attr('data-separator');
	            }
	            input.val(input.val() + token);
	            input.change();
	            this.ui.namingTokenHelper.removeClass('open');
	            input.focus();
	        },
	        multiEpisodeFormatChanged           : function() {
	            this.model.set('multiEpisodeStyle', this.ui.multiEpisodeStyle.val());
	        }
	    });
	    AsModelBoundView.call(view);
	    AsValidatedView.call(view);
	    return view;
	}).call(this);

/***/ },
/* 215 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({ url : window.NzbDrone.ApiRoot + '/config/naming/samples' });

/***/ },
/* 216 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var Config = __webpack_require__(35);
	var NamingSampleModel = __webpack_require__(215);
	var BasicNamingModel = __webpack_require__(217);
	var AsModelBoundView = __webpack_require__(218);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/MediaManagement/Naming/Basic/BasicNamingViewTemplate',
	
	    ui : {
	        namingOptions        : '.x-naming-options',
	        singleEpisodeExample : '.x-single-episode-example',
	        multiEpisodeExample  : '.x-multi-episode-example',
	        dailyEpisodeExample  : '.x-daily-episode-example'
	    },
	
	    initialize : function(options) {
	        this.namingModel = options.model;
	        this.model = new BasicNamingModel();
	
	        this._parseNamingModel();
	
	        this.listenTo(this.model, 'change', this._buildFormat);
	        this.listenTo(this.namingModel, 'sync', this._parseNamingModel);
	    },
	
	    _parseNamingModel : function() {
	        var standardFormat = this.namingModel.get('standardMovieFormat');
	
	        var includeSeriesTitle = false;//standardFormat.match(/\{Series[-_. ]Title\}/i);
	        var includeEpisodeTitle = false;//standardFormat.match(/\{Episode[-_. ]Title\}/i);
	        var includeQuality = standardFormat.match(/\{Quality[-_. ]Title\}/i);
	        var numberStyle = standardFormat.match(/s?\{season(?:\:0+)?\}[ex]\{episode(?:\:0+)?\}/i);
	        var replaceSpaces = standardFormat.indexOf(' ') === -1;
	        var separator = standardFormat.match(/\}( - |\.-\.|\.| )|( - |\.-\.|\.| )\{/i);
	
	        if (separator === null || separator[1] === '.-.') {
	            separator = ' - ';
	        } else {
	            separator = separator[1];
	        }
	
	        if (numberStyle === null) {
	            numberStyle = 'S{season:00}E{episode:00}';
	        } else {
	            numberStyle = numberStyle[0];
	        }
	
	        this.model.set({
	            includeSeriesTitle  : includeSeriesTitle !== null,
	            includeEpisodeTitle : includeEpisodeTitle !== null,
	            includeQuality      : includeQuality !== null,
	            numberStyle         : numberStyle,
	            replaceSpaces       : replaceSpaces,
	            separator           : separator
	        }, { silent : true });
	    },
	
	    _buildFormat : function() {
	        if (Config.getValueBoolean(Config.Keys.AdvancedSettings)) {
	            return;
	        }
	
	        var standardEpisodeFormat = '';
	        var dailyEpisodeFormat = '';
	
	        if (this.model.get('includeSeriesTitle')) {
	            if (this.model.get('replaceSpaces')) {
	                standardEpisodeFormat += '{Series.Title}';
	                dailyEpisodeFormat += '{Series.Title}';
	            } else {
	                standardEpisodeFormat += '{Series Title}';
	                dailyEpisodeFormat += '{Series Title}';
	            }
	
	            standardEpisodeFormat += this.model.get('separator');
	            dailyEpisodeFormat += this.model.get('separator');
	        }
	
	        standardEpisodeFormat += this.model.get('numberStyle');
	        dailyEpisodeFormat += '{Air-Date}';
	
	        if (this.model.get('includeEpisodeTitle')) {
	            standardEpisodeFormat += this.model.get('separator');
	            dailyEpisodeFormat += this.model.get('separator');
	
	            if (this.model.get('replaceSpaces')) {
	                standardEpisodeFormat += '{Episode.Title}';
	                dailyEpisodeFormat += '{Episode.Title}';
	            } else {
	                standardEpisodeFormat += '{Episode Title}';
	                dailyEpisodeFormat += '{Episode Title}';
	            }
	        }
	
	        if (this.model.get('includeQuality')) {
	            if (this.model.get('replaceSpaces')) {
	                standardEpisodeFormat += ' {Quality.Title}';
	                dailyEpisodeFormat += ' {Quality.Title}';
	            } else {
	                standardEpisodeFormat += ' {Quality Title}';
	                dailyEpisodeFormat += ' {Quality Title}';
	            }
	        }
	
	        if (this.model.get('replaceSpaces')) {
	            standardEpisodeFormat = standardEpisodeFormat.replace(/\s/g, '.');
	            dailyEpisodeFormat = dailyEpisodeFormat.replace(/\s/g, '.');
	        }
	
	        this.namingModel.set('standardEpisodeFormat', standardEpisodeFormat);
	        this.namingModel.set('dailyEpisodeFormat', dailyEpisodeFormat);
	        this.namingModel.set('animeEpisodeFormat', standardEpisodeFormat);
	    }
	});
	
	module.exports = AsModelBoundView.call(view);


/***/ },
/* 217 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 218 */
/***/ function(module, exports, __webpack_require__) {

	var ModelBinder = __webpack_require__(219);
	
	module.exports = function() {
	
	    var originalOnRender = this.prototype.onRender;
	    var originalBeforeClose = this.prototype.onBeforeClose;
	
	    this.prototype.onRender = function() {
	
	        if (!this.model) {
	            throw 'View has no model for binding';
	        }
	
	        if (!this._modelBinder) {
	            this._modelBinder = new ModelBinder();
	        }
	
	        var options = {
	            changeTriggers : {
	                ''                  : 'change typeahead:selected typeahead:autocompleted',
	                '[contenteditable]' : 'blur',
	                '[data-onkeyup]'    : 'keyup'
	            }
	        };
	
	        this._modelBinder.bind(this.model, this.el, null, options);
	
	        if (originalOnRender) {
	            originalOnRender.call(this);
	        }
	    };
	
	    this.prototype.onBeforeClose = function() {
	
	        if (this._modelBinder) {
	            this._modelBinder.unbind();
	            delete this._modelBinder;
	        }
	
	        if (originalBeforeClose) {
	            originalBeforeClose.call(this);
	        }
	    };
	
	    return this;
	};


/***/ },
/* 219 */,
/* 220 */
/***/ function(module, exports, __webpack_require__) {

	var Validation = __webpack_require__(221);
	var _ = __webpack_require__(8);
	
	module.exports = (function() {
	    'use strict';
	    return function() {
	
	        var originalInitialize = this.prototype.initialize;
	        var originalOnRender = this.prototype.onRender;
	        var originalBeforeClose = this.prototype.onBeforeClose;
	
	        var errorHandler = function(response) {
	            if (this.model) {
	                this.model.trigger('validation:failed', response);
	            } else {
	                this.trigger('validation:failed', response);
	            }
	        };
	
	        var validatedSync = function(method, model, options) {
	            model.trigger('validation:sync');
	
	            arguments[2].isValidatedCall = true;
	            return model._originalSync.apply(this, arguments).fail(errorHandler.bind(this));
	        };
	
	        var bindToModel = function(model) {
	            if (!model._originalSync) {
	                model._originalSync = model.sync;
	                model.sync = validatedSync.bind(this);
	            }
	        };
	
	        var validationFailed = function(response) {
	            if (response.status === 400) {
	                var view = this;
	                var validationErrors = JSON.parse(response.responseText);
	                _.each(validationErrors, function(error) {
	                    view.$el.processServerError(error);
	                });
	            }
	        };
	
	        this.prototype.initialize = function(options) {
	            if (this.model) {
	                this.listenTo(this.model, 'validation:sync', function() {
	                    this.$el.removeAllErrors();
	                });
	
	                this.listenTo(this.model, 'validation:failed', validationFailed);
	            } else {
	                this.listenTo(this, 'validation:sync', function() {
	                    this.$el.removeAllErrors();
	                });
	
	                this.listenTo(this, 'validation:failed', validationFailed);
	            }
	
	            if (originalInitialize) {
	                originalInitialize.call(this, options);
	            }
	        };
	
	        this.prototype.onRender = function() {
	            Validation.bind(this);
	            this.bindToModelValidation = bindToModel.bind(this);
	
	            if (this.model) {
	                this.bindToModelValidation(this.model);
	            }
	
	            if (originalOnRender) {
	                originalOnRender.call(this);
	            }
	        };
	
	        this.prototype.onBeforeClose = function() {
	            if (this.model) {
	                Validation.unbind(this);
	
	                //If we don't do this the next time the model is used the sync is bound to an old view
	                this.model.sync = this.model._originalSync;
	                this.model._originalSync = undefined;
	            }
	
	            if (originalBeforeClose) {
	                originalBeforeClose.call(this);
	            }
	        };
	
	        return this;
	    };
	}).call(this);

/***/ },
/* 221 */,
/* 222 */,
/* 223 */,
/* 224 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/MediaManagement/Sorting/SortingViewTemplate'
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	
	module.exports = view;

/***/ },
/* 225 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	__webpack_require__(226);
	__webpack_require__(228);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/MediaManagement/FileManagement/FileManagementViewTemplate',
	
	    ui : {
	        recyclingBin : '.x-path'
	    },
	
	    onShow : function() {
	        this.ui.recyclingBin.fileBrowser();
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	
	module.exports = view;

/***/ },
/* 226 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	__webpack_require__(227);
	
	$.fn.directoryAutoComplete = function(options) {
	    options = options || {};
	
	    var query = 'path';
	    var data = {
	        includeFiles: options.includeFiles || false
	    };
	
	    $(this).autoComplete({
	        resource : '/filesystem',
	        query    : query,
	        data     : data,
	        filter   : function(filter, response, callback) {
	            var matches = [];
	            var results = response.directories.concat(response.files);
	
	            $.each(results, function(i, d) {
	                if (d[query] && d[query].startsWith(filter)) {
	                    matches.push({ value : d[query] });
	                }
	            });
	
	            callback(matches);
	        }
	    });
	};

/***/ },
/* 227 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	__webpack_require__(67);
	
	$.fn.autoComplete = function(options) {
	    if (!options) {
	        throw 'options are required';
	    }
	
	    if (!options.resource) {
	        throw 'resource is required';
	    }
	
	    if (!options.query) {
	        throw 'query is required';
	    }
	
	    $(this).typeahead({
	        hint      : true,
	        highlight : true,
	        minLength : 3,
	        items     : 20
	    }, {
	        name       : options.resource.replace('/'),
	        displayKey : '',
	        source     : function(filter, callback) {
	            var data = options.data || {};
	            data[options.query] = filter;
	            $.ajax({
	                url      : window.NzbDrone.ApiRoot + options.resource,
	                dataType : 'json',
	                type     : 'GET',
	                data     : data,
	                success  : function(response) {
	                    if (options.filter) {
	                        options.filter.call(this, filter, response, callback);
	                    } else {
	                        var matches = [];
	
	                        $.each(response, function(i, d) {
	                            if (d[options.query] && d[options.property].startsWith(filter)) {
	                                matches.push({ value : d[options.property] });
	                            }
	                        });
	
	                        callback(matches);
	                    }
	                }
	            });
	        }
	    });
	};

/***/ },
/* 228 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	__webpack_require__(229);
	__webpack_require__(226);
	
	$.fn.fileBrowser = function(options) {
	    var inputs = $(this);
	
	    inputs.each(function() {
	        var input = $(this);
	        var inputOptions = $.extend({ input : input, showFiles: input.hasClass('x-filepath') }, options);
	        var inputGroup = $('<div class="input-group"></div>');
	        var inputGroupButton = $('<span class="input-group-btn"></span>');
	
	        var button = $('<button class="btn btn-primary x-file-browser" title="Browse"><i class="icon-sonarr-folder-open"/></button>');
	
	        if (input.parent('.input-group').length > 0) {
	            input.parent('.input-group').find('.input-group-btn').prepend(button);
	        } else {
	            inputGroupButton.append(button);
	            input.wrap(inputGroup);
	            input.after(inputGroupButton);
	        }
	
	        button.on('click', function() {
	            vent.trigger(vent.Commands.ShowFileBrowser, inputOptions);
	        });
	
	        input.directoryAutoComplete({ includeFiles: inputOptions.showFiles });
	    });
	
	};


/***/ },
/* 229 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var FileBrowserCollection = __webpack_require__(230);
	var EmptyView = __webpack_require__(232);
	var FileBrowserRow = __webpack_require__(233);
	var FileBrowserTypeCell = __webpack_require__(234);
	var FileBrowserNameCell = __webpack_require__(235);
	var RelativeDateCell = __webpack_require__(127);
	var FileSizeCell = __webpack_require__(147);
	var LoadingView = __webpack_require__(117);
	__webpack_require__(226);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Shared/FileBrowser/FileBrowserLayoutTemplate',
	
	    regions : {
	        browser : '#x-browser'
	    },
	
	    ui : {
	        path      : '.x-path',
	        indicator : '.x-indicator'
	    },
	
	    events : {
	        'typeahead:selected .x-path'      : '_pathChanged',
	        'typeahead:autocompleted .x-path' : '_pathChanged',
	        'keyup .x-path'                   : '_inputChanged',
	        'click .x-ok'                     : '_selectPath'
	    },
	
	    initialize : function(options) {
	        this.collection = new FileBrowserCollection();
	        this.collection.showFiles = options.showFiles || false;
	        this.collection.showLastModified = options.showLastModified || false;
	        this.input = options.input;
	        this._setColumns();
	        this.listenTo(this.collection, 'sync', this._showGrid);
	        this.listenTo(this.collection, 'filebrowser:row:folderselected', this._rowSelected);
	        this.listenTo(this.collection, 'filebrowser:row:fileselected', this._fileSelected);
	    },
	
	    onRender : function() {
	        this.browser.show(new LoadingView());
	        this.ui.path.directoryAutoComplete();
	        this._fetchCollection(this.input.val());
	        this._updatePath(this.input.val());
	    },
	
	    _setColumns : function() {
	        this.columns = [
	            {
	                name     : 'type',
	                label    : '',
	                sortable : false,
	                cell     : FileBrowserTypeCell
	            },
	            {
	                name     : 'name',
	                label    : 'Name',
	                sortable : false,
	                cell     : FileBrowserNameCell
	            }
	        ];
	        if (this.collection.showLastModified) {
	            this.columns.push({
	                name     : 'lastModified',
	                label    : 'Last Modified',
	                sortable : false,
	                cell     : RelativeDateCell
	            });
	        }
	        if (this.collection.showFiles) {
	            this.columns.push({
	                name     : 'size',
	                label    : 'Size',
	                sortable : false,
	                cell     : FileSizeCell
	            });
	        }
	    },
	
	    _fetchCollection : function(path) {
	        this.ui.indicator.show();
	        var data = { includeFiles : this.collection.showFiles };
	        if (path) {
	            data.path = path;
	        }
	        this.collection.fetch({ data : data });
	    },
	
	    _showGrid : function() {
	        this.ui.indicator.hide();
	        if (this.collection.models.length === 0) {
	            this.browser.show(new EmptyView());
	            return;
	        }
	        var grid = new Backgrid.Grid({
	            row        : FileBrowserRow,
	            collection : this.collection,
	            columns    : this.columns,
	            className  : 'table table-hover'
	        });
	        this.browser.show(grid);
	    },
	
	    _rowSelected : function(model) {
	        var path = model.get('path');
	
	        this._updatePath(path);
	        this._fetchCollection(path);
	    },
	
	    _fileSelected : function(model) {
	        var path = model.get('path');
	        var type = model.get('type');
	
	        this.input.val(path);
	        this.input.trigger('change');
	
	        this.input.trigger('filebrowser:fileselected', {
	            type : type,
	            path : path
	        });
	
	        vent.trigger(vent.Commands.CloseFileBrowser);
	    },
	
	    _pathChanged : function(e, path) {
	        this._fetchCollection(path.value);
	        this._updatePath(path.value);
	    },
	
	    _inputChanged : function() {
	        var path = this.ui.path.val();
	        if (path === '' || path.endsWith('\\') || path.endsWith('/')) {
	            this._fetchCollection(path);
	        }
	    },
	
	    _updatePath : function(path) {
	        if (path !== undefined || path !== null) {
	            this.ui.path.val(path);
	        }
	    },
	
	    _selectPath : function() {
	        var path = this.ui.path.val();
	
	        this.input.val(path);
	        this.input.trigger('change');
	
	        this.input.trigger('filebrowser:folderselected', {
	            type: 'folder',
	            path: path
	        });
	
	        vent.trigger(vent.Commands.CloseFileBrowser);
	    }
	});


/***/ },
/* 230 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var Backbone = __webpack_require__(6);
	var FileBrowserModel = __webpack_require__(231);
	
	module.exports = Backbone.Collection.extend({
	    model : FileBrowserModel,
	    url   : window.NzbDrone.ApiRoot + '/filesystem',
	
	    parse : function(response) {
	        var contents = [];
	        if (response.parent || response.parent === '') {
	            var type = 'parent';
	            var name = '...';
	            if (response.parent === '') {
	                type = 'computer';
	                name = 'My Computer';
	            }
	            contents.push({
	                type : type,
	                name : name,
	                path : response.parent
	            });
	        }
	        $.merge(contents, response.directories);
	        $.merge(contents, response.files);
	        return contents;
	    }
	});

/***/ },
/* 231 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 232 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'Shared/FileBrowser/EmptyViewTemplate'
	});

/***/ },
/* 233 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Row.extend({
	    className : 'file-browser-row',
	
	    events : {
	        'click' : '_selectRow'
	    },
	
	    _originalInit : Backgrid.Row.prototype.initialize,
	
	    initialize : function() {
	        this._originalInit.apply(this, arguments);
	    },
	
	    _selectRow : function() {
	        if (this.model.get('type') === 'file') {
	            this.model.collection.trigger('filebrowser:row:fileselected', this.model);
	        } else {
	            this.model.collection.trigger('filebrowser:row:folderselected', this.model);
	        }
	    }
	});

/***/ },
/* 234 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'file-browser-type-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var type = this.model.get(this.column.get('name'));
	        var icon = 'icon-sonarr-hdd';
	
	        if (type === 'computer') {
	            icon = 'icon-sonarr-browser-computer';
	        } else if (type === 'parent') {
	            icon = 'icon-sonarr-browser-up';
	        } else if (type === 'folder') {
	            icon = 'icon-sonarr-browser-folder';
	        } else if (type === 'file') {
	            icon = 'icon-sonarr-browser-file';
	        }
	
	        this.$el.html('<i class="{0}"></i>'.format(icon));
	        this.delegateEvents();
	
	        return this;
	    }
	});

/***/ },
/* 235 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'file-browser-name-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var name = this.model.get(this.column.get('name'));
	
	        this.$el.html(name);
	
	        this.delegateEvents();
	
	        return this;
	    }
	});

/***/ },
/* 236 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/MediaManagement/Permissions/PermissionsViewTemplate'
	});
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	
	module.exports = view;

/***/ },
/* 237 */
/***/ function(module, exports, __webpack_require__) {

	var SettingsModelBase = __webpack_require__(210);
	
	module.exports = SettingsModelBase.extend({
	    url            : window.NzbDrone.ApiRoot + '/config/mediamanagement',
	    successMessage : 'Media management settings saved',
	    errorMessage   : 'Failed to save media management settings'
	});

/***/ },
/* 238 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ProfileCollection = __webpack_require__(44);
	var ProfileCollectionView = __webpack_require__(239);
	var DelayProfileLayout = __webpack_require__(253);
	var DelayProfileCollection = __webpack_require__(263);
	var LanguageCollection = __webpack_require__(247);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Settings/Profile/ProfileLayoutTemplate',
	
	    regions : {
	        profile      : '#profile',
	        delayProfile : '#delay-profile'
	    },
	
	    initialize : function(options) {
	        this.settings = options.settings;
	        ProfileCollection.fetch();
	
	        this.delayProfileCollection = new DelayProfileCollection();
	        this.delayProfileCollection.fetch();
	    },
	
	    onShow : function() {
	        this.profile.show(new ProfileCollectionView({ collection : ProfileCollection }));
	        this.delayProfile.show(new DelayProfileLayout({ collection : this.delayProfileCollection }));
	    }
	});

/***/ },
/* 239 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var ProfileView = __webpack_require__(240);
	var EditProfileView = __webpack_require__(241);
	var ProfileCollection = __webpack_require__(129);
	var _ = __webpack_require__(8);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : ProfileView,
	    itemViewContainer : '.profiles',
	    template          : 'Settings/Profile/ProfileCollectionTemplate',
	
	    ui : {
	        'addCard' : '.x-add-card'
	    },
	
	    events : {
	        'click .x-add-card' : '_addProfile'
	    },
	
	    appendHtml : function(collectionView, itemView, index) {
	        collectionView.ui.addCard.parent('li').before(itemView.el);
	    },
	
	    _addProfile : function() {
	        var self = this;
	        var schemaCollection = new ProfileCollection();
	        schemaCollection.fetch({
	            success : function(collection) {
	                var model = _.first(collection.models);
	                model.set('id', undefined);
	                model.set('name', '');
	                model.collection = self.collection;
	                var view = new EditProfileView({
	                    model             : model,
	                    profileCollection : self.collection
	                });
	
	                AppLayout.modalRegion.show(view);
	            }
	        });
	    }
	});

/***/ },
/* 240 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditProfileView = __webpack_require__(241);
	var AsModelBoundView = __webpack_require__(218);
	__webpack_require__(251);
	__webpack_require__(252);
	__webpack_require__(73);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Profile/ProfileViewTemplate',
	    tagName  : 'li',
	
	    ui : {
	        "progressbar"  : '.progress .bar',
	        "deleteButton" : '.x-delete'
	    },
	
	    events : {
	        'click' : '_editProfile'
	    },
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this.render);
	    },
	
	    _editProfile : function() {
	        var view = new EditProfileView({
	            model             : this.model,
	            profileCollection : this.model.collection
	        });
	        AppLayout.modalRegion.show(view);
	    }
	});
	
	module.exports = AsModelBoundView.call(view);

/***/ },
/* 241 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var Backbone = __webpack_require__(6);
	var EditProfileItemView = __webpack_require__(242);
	var QualitySortableCollectionView = __webpack_require__(243);
	var EditProfileView = __webpack_require__(246);
	var DeleteView = __webpack_require__(249);
	var SeriesCollection = __webpack_require__(123);
	var Config = __webpack_require__(35);
	var AsEditModalView = __webpack_require__(250);
	
	var view = Marionette.Layout.extend({
	    template : 'Settings/Profile/Edit/EditProfileLayoutTemplate',
	
	    regions : {
	        fields    : '#x-fields',
	        qualities : '#x-qualities'
	    },
	
	    ui : {
	        deleteButton : '.x-delete'
	    },
	
	    _deleteView : DeleteView,
	
	    initialize : function(options) {
	        this.profileCollection = options.profileCollection;
	        this.itemsCollection = new Backbone.Collection(_.toArray(this.model.get('items')).reverse());
	        this.listenTo(SeriesCollection, 'all', this._updateDisableStatus);
	    },
	
	    onRender : function() {
	        this._updateDisableStatus();
	    },
	
	    onShow : function() {
	        this.fieldsView = new EditProfileView({ model : this.model });
	        this._showFieldsView();
	        var advancedShown = Config.getValueBoolean(Config.Keys.AdvancedSettings, false);
	
	        this.sortableListView = new QualitySortableCollectionView({
	            selectable     : true,
	            selectMultiple : true,
	            clickToSelect  : true,
	            clickToToggle  : true,
	            sortable       : advancedShown,
	
	            sortableOptions : {
	                handle : '.x-drag-handle'
	            },
	
	            visibleModelsFilter : function(model) {
	                return model.get('quality').id !== 0 || advancedShown;
	            },
	
	            collection : this.itemsCollection,
	            model      : this.model
	        });
	
	        this.sortableListView.setSelectedModels(this.itemsCollection.filter(function(item) {
	            return item.get('allowed') === true;
	        }));
	        this.qualities.show(this.sortableListView);
	
	        this.listenTo(this.sortableListView, 'selectionChanged', this._selectionChanged);
	        this.listenTo(this.sortableListView, 'sortStop', this._updateModel);
	    },
	
	    _onBeforeSave : function() {
	        var cutoff = this.fieldsView.getCutoff();
	        this.model.set('cutoff', cutoff);
	    },
	
	    _onAfterSave : function() {
	        this.profileCollection.add(this.model, { merge : true });
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _selectionChanged : function(newSelectedModels, oldSelectedModels) {
	        var addedModels = _.difference(newSelectedModels, oldSelectedModels);
	        var removeModels = _.difference(oldSelectedModels, newSelectedModels);
	
	        _.each(removeModels, function(item) {
	            item.set('allowed', false);
	        });
	        _.each(addedModels, function(item) {
	            item.set('allowed', true);
	        });
	        this._updateModel();
	    },
	
	    _updateModel : function() {
	        this.model.set('items', this.itemsCollection.toJSON().reverse());
	
	        this._showFieldsView();
	    },
	
	    _showFieldsView : function() {
	        this.fields.show(this.fieldsView);
	    },
	
	    _updateDisableStatus : function() {
	        if (this._isQualityInUse()) {
	            this.ui.deleteButton.addClass('disabled');
	            this.ui.deleteButton.attr('title', 'Can\'t delete a profile that is attached to a series.');
	        } else {
	            this.ui.deleteButton.removeClass('disabled');
	        }
	    },
	
	    _isQualityInUse : function() {
	        return SeriesCollection.where({ 'profileId' : this.model.id }).length !== 0;
	    }
	});
	module.exports = AsEditModalView.call(view);


/***/ },
/* 242 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/Profile/Edit/EditProfileItemViewTemplate'
	});

/***/ },
/* 243 */
/***/ function(module, exports, __webpack_require__) {

	var BackboneSortableCollectionView = __webpack_require__(244);
	var EditProfileItemView = __webpack_require__(242);
	
	module.exports = BackboneSortableCollectionView.extend({
	    className : 'qualities',
	    modelView : EditProfileItemView,
	
	    attributes : {
	        'validation-name' : 'items'
	    },
	
	    events : {
	        'click li, td'    : '_listItem_onMousedown',
	        'dblclick li, td' : '_listItem_onDoubleClick',
	        'keydown'         : '_onKeydown'
	    }
	});

/***/ },
/* 244 */,
/* 245 */,
/* 246 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var LanguageCollection = __webpack_require__(247);
	var Config = __webpack_require__(35);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Profile/Edit/EditProfileViewTemplate',
	
	    ui : { cutoff : '.x-cutoff' },
	
	    templateHelpers : function() {
	        return {
	            languages : LanguageCollection.toJSON()
	        };
	    },
	
	    getCutoff : function() {
	        var self = this;
	
	        return _.findWhere(_.pluck(this.model.get('items'), 'quality'), { id : parseInt(self.ui.cutoff.val(), 10) });
	    }
	});
	
	AsValidatedView.call(view);
	
	module.exports = AsModelBoundView.call(view);

/***/ },
/* 247 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var LanguageModel = __webpack_require__(248);
	
	var LanuageCollection = Backbone.Collection.extend({
	    model : LanguageModel,
	    url   : window.NzbDrone.ApiRoot + '/language'
	});
	
	var languages = new LanuageCollection();
	languages.fetch();
	
	module.exports = languages;

/***/ },
/* 248 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 249 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/Profile/DeleteProfileViewTemplate',
	
	    events : {
	        'click .x-confirm-delete' : '_removeProfile'
	    },
	
	    _removeProfile : function() {
	        this.model.destroy({ wait : true }).done(function() {
	            vent.trigger(vent.Commands.CloseModalCommand);
	        });
	    }
	});

/***/ },
/* 250 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	
	module.exports = function() {
	    var originalInitialize = this.prototype.initialize;
	    var originalOnBeforeClose = this.prototype.onBeforeClose;
	
	    var saveInternal = function() {
	        var self = this;
	
	        if (this.saving) {
	            return this.savePromise;
	        }
	
	        this.saving = true;
	        this.ui.indicator.show();
	
	        if (this._onBeforeSave) {
	            this._onBeforeSave.call(this);
	        }
	
	        this.savePromise = this.model.save();
	
	        this.savePromise.always(function() {
	            self.saving = false;
	
	            if (!self.isClosed) {
	                self.ui.indicator.hide();
	            }
	        });
	
	        this.savePromise.done(function() {
	            self.originalModelData = JSON.stringify(self.model.toJSON());
	        });
	
	        return this.savePromise;
	    };
	
	    this.prototype.initialize = function(options) {
	        if (!this.model) {
	            throw 'View has no model';
	        }
	
	        this.testing = false;
	        this.saving = false;
	
	        this.originalModelData = JSON.stringify(this.model.toJSON());
	
	        this.events = this.events || {};
	        this.events['click .x-save'] = '_save';
	        this.events['click .x-save-and-add'] = '_saveAndAdd';
	        this.events['click .x-test'] = '_test';
	        this.events['click .x-delete'] = '_delete';
	
	        this.ui = this.ui || {};
	        this.ui.indicator = '.x-indicator';
	
	        if (originalInitialize) {
	            originalInitialize.call(this, options);
	        }
	    };
	
	    this.prototype._save = function() {
	        var self = this;
	        var promise = saveInternal.call(this);
	
	        promise.done(function() {
	            if (self._onAfterSave) {
	                self._onAfterSave.call(self);
	            }
	        });
	    };
	
	    this.prototype._saveAndAdd = function() {
	        var self = this;
	        var promise = saveInternal.call(this);
	
	        promise.done(function() {
	            if (self._onAfterSaveAndAdd) {
	                self._onAfterSaveAndAdd.call(self);
	            }
	        });
	    };
	
	    this.prototype._test = function() {
	        var self = this;
	
	        if (this.testing) {
	            return;
	        }
	
	        this.testing = true;
	        this.ui.indicator.show();
	
	        this.model.test().always(function() {
	            self.testing = false;
	            self.ui.indicator.hide();
	        });
	    };
	
	    this.prototype._delete = function() {
	        var view = new this._deleteView({ model : this.model });
	        AppLayout.modalRegion.show(view);
	    };
	
	    this.prototype.onBeforeClose = function() {
	        this.model.set(JSON.parse(this.originalModelData));
	
	        if (originalOnBeforeClose) {
	            originalOnBeforeClose.call(this);
	        }
	    };
	
	    return this;
	};


/***/ },
/* 251 */
/***/ function(module, exports, __webpack_require__) {

	var Handlebars = __webpack_require__(14);
	var _ = __webpack_require__(8);
	
	Handlebars.registerHelper('allowedLabeler', function() {
	    var ret = '';
	    var cutoff = this.cutoff;
	
	    _.each(this.items, function(item) {
	        if (item.allowed) {
	            if (item.quality.id === cutoff.id) {
	                ret += '<li><span class="label label-info" title="Cutoff">' + item.quality.name + '</span></li>';
	            } else {
	                ret += '<li><span class="label label-default">' + item.quality.name + '</span></li>';
	            }
	        }
	    });
	
	    return new Handlebars.SafeString(ret);
	});

/***/ },
/* 252 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Handlebars = __webpack_require__(14);
	var LanguageCollection = __webpack_require__(247);
	
	Handlebars.registerHelper('languageLabel', function() {
	    var wantedLanguage = this.language;
	
	    var language = LanguageCollection.find(function(lang) {
	        return lang.get('nameLower') === wantedLanguage;
	    });
	
	    var result = '<span class="label label-primary">' + language.get('name') + '</span>';
	
	    return new Handlebars.SafeString(result);
	});

/***/ },
/* 253 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var Backbone = __webpack_require__(6);
	var DelayProfileCollectionView = __webpack_require__(254);
	var EditView = __webpack_require__(256);
	var Model = __webpack_require__(262);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Settings/Profile/Delay/DelayProfileLayoutTemplate',
	
	    regions : {
	        delayProfiles : '.x-rows'
	    },
	
	    events : {
	        'click .x-add' : '_add'
	    },
	
	    initialize : function(options) {
	        this.collection = options.collection;
	
	        this._updateOrderedCollection();
	
	        this.listenTo(this.collection, 'sync', this._updateOrderedCollection);
	        this.listenTo(this.collection, 'add', this._updateOrderedCollection);
	        this.listenTo(this.collection, 'remove', function() {
	            this.collection.fetch();
	        });
	    },
	
	    onRender : function() {
	
	        this.sortableListView = new DelayProfileCollectionView({
	            sortable   : true,
	            collection : this.orderedCollection,
	
	            sortableOptions : {
	                handle : '.x-drag-handle'
	            },
	
	            sortableModelsFilter : function(model) {
	                return model.get('id') !== 1;
	            }
	        });
	
	        this.delayProfiles.show(this.sortableListView);
	
	        this.listenTo(this.sortableListView, 'sortStop', this._updateOrder);
	    },
	
	    _updateOrder : function() {
	        var self = this;
	
	        this.collection.forEach(function(model) {
	            if (model.get('id') === 1) {
	                return;
	            }
	
	            var orderedModel = self.orderedCollection.get(model);
	            var order = self.orderedCollection.indexOf(orderedModel) + 1;
	
	            if (model.get('order') !== order) {
	                model.set('order', order);
	                model.save();
	            }
	        });
	    },
	
	    _add : function() {
	        var model = new Model({
	            enableUsenet      : true,
	            enableTorrent     : true,
	            preferredProtocol : 'usenet',
	            usenetDelay       : 0,
	            torrentDelay      : 0,
	            order             : this.collection.length,
	            tags              : []
	        });
	
	        model.collection = this.collection;
	        var view = new EditView({
	            model            : model,
	            targetCollection : this.collection
	        });
	
	        AppLayout.modalRegion.show(view);
	    },
	
	    _updateOrderedCollection : function() {
	        if (!this.orderedCollection) {
	            this.orderedCollection = new Backbone.Collection();
	        }
	
	        this.orderedCollection.reset(_.sortBy(this.collection.models, function(model) {
	            return model.get('order');
	        }));
	    }
	});

/***/ },
/* 254 */
/***/ function(module, exports, __webpack_require__) {

	var BackboneSortableCollectionView = __webpack_require__(244);
	var DelayProfileItemView = __webpack_require__(255);
	
	module.exports = BackboneSortableCollectionView.extend({
	    className : 'delay-profiles',
	    modelView : DelayProfileItemView,
	
	    events : {
	        'click li, td'    : '_listItem_onMousedown',
	        'dblclick li, td' : '_listItem_onDoubleClick',
	        'keydown'         : '_onKeydown'
	    }
	});

/***/ },
/* 255 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(256);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Settings/Profile/Delay/DelayProfileItemViewTemplate',
	    className : 'row',
	
	    events : {
	        'click .x-edit' : '_edit'
	    },
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this.render);
	    },
	
	    _edit : function() {
	        var view = new EditView({
	            model            : this.model,
	            targetCollection : this.model.collection
	        });
	        AppLayout.modalRegion.show(view);
	    }
	});

/***/ },
/* 256 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var DeleteView = __webpack_require__(257);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	__webpack_require__(258);
	__webpack_require__(73);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Profile/Delay/Edit/DelayProfileEditViewTemplate',
	
	    _deleteView : DeleteView,
	
	    ui : {
	        tags         : '.x-tags',
	        usenetDelay  : '.x-usenet-delay',
	        torrentDelay : '.x-torrent-delay',
	        protocol     : '.x-protocol'
	    },
	
	    events : {
	        'change .x-protocol' : '_updateModel'
	    },
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    onRender : function() {
	        if (this.model.id !== 1) {
	            this.ui.tags.tagInput({
	                model    : this.model,
	                property : 'tags'
	            });
	        }
	
	        this._toggleControls();
	    },
	
	    _onAfterSave : function() {
	        this.targetCollection.add(this.model, { merge : true });
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _updateModel : function() {
	        var protocol = this.ui.protocol.val();
	
	        if (protocol === 'preferUsenet') {
	            this.model.set({
	                enableUsenet      : true,
	                enableTorrent     : true,
	                preferredProtocol : 'usenet'
	            });
	        }
	
	        if (protocol === 'preferTorrent') {
	            this.model.set({
	                enableUsenet      : true,
	                enableTorrent     : true,
	                preferredProtocol : 'torrent'
	            });
	        }
	
	        if (protocol === 'onlyUsenet') {
	            this.model.set({
	                enableUsenet      : true,
	                enableTorrent     : false,
	                preferredProtocol : 'usenet'
	            });
	        }
	
	        if (protocol === 'onlyTorrent') {
	            this.model.set({
	                enableUsenet      : false,
	                enableTorrent     : true,
	                preferredProtocol : 'torrent'
	            });
	        }
	
	        this._toggleControls();
	    },
	
	    _toggleControls : function() {
	        var enableUsenet = this.model.get('enableUsenet');
	        var enableTorrent = this.model.get('enableTorrent');
	        var preferred = this.model.get('preferredProtocol');
	
	        if (preferred === 'usenet') {
	            this.ui.protocol.val('preferUsenet');
	        }
	
	        else {
	            this.ui.protocol.val('preferTorrent');
	        }
	
	        if (enableUsenet) {
	            this.ui.usenetDelay.show();
	        }
	
	        else {
	            this.ui.protocol.val('onlyTorrent');
	            this.ui.usenetDelay.hide();
	        }
	
	        if (enableTorrent) {
	            this.ui.torrentDelay.show();
	        }
	
	        else {
	            this.ui.protocol.val('onlyUsenet');
	            this.ui.torrentDelay.hide();
	        }
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	
	module.exports = view;

/***/ },
/* 257 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/Profile/Delay/Delete/DelayProfileDeleteViewTemplate',
	
	    events : {
	        'click .x-confirm-delete' : '_delete'
	    },
	
	    _delete : function() {
	        var collection = this.model.collection;
	
	        this.model.destroy({
	            wait    : true,
	            success : function() {
	                vent.trigger(vent.Commands.CloseModalCommand);
	            }
	        });
	    }
	});

/***/ },
/* 258 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var TagCollection = __webpack_require__(259);
	var TagModel = __webpack_require__(260);
	__webpack_require__(261);
	
	var substringMatcher = function(tagCollection) {
	    return function findMatches (q, cb) {
	        q = q.replace(/[^-_a-z0-9]/gi, '').toLowerCase();
	        var matches = _.select(tagCollection.toJSON(), function(tag) {
	            return tag.label.toLowerCase().indexOf(q) > -1;
	        });
	        cb(matches);
	    };
	};
	var getExistingTags = function(tagValues) {
	    return _.select(TagCollection.toJSON(), function(tag) {
	        return _.contains(tagValues, tag.id);
	    });
	};
	
	var testTag = function(item) {
	    var tagLimitations = new RegExp('[^-_a-z0-9]', 'i');
	    try {
	        return !tagLimitations.test(item);
	    }
	    catch (e) {
	        return false;
	    }
	};
	
	var originalAdd = $.fn.tagsinput.Constructor.prototype.add;
	var originalRemove = $.fn.tagsinput.Constructor.prototype.remove;
	var originalBuild = $.fn.tagsinput.Constructor.prototype.build;
	
	$.fn.tagsinput.Constructor.prototype.add = function(item, dontPushVal) {
	    var tagCollection = this.options.tagCollection;
	
	    if (!tagCollection) {
	        originalAdd.call(this, item, dontPushVal);
	        return;
	    }
	    var self = this;
	
	    if (typeof item === 'string') {
	        var existing = _.find(tagCollection.toJSON(), { label : item });
	
	        if (existing) {
	            originalAdd.call(this, existing, dontPushVal);
	        } else if (this.options.allowNew) {
	            if (item === null || item === '' || !testTag(item)) {
	                return;
	            }
	
	            var newTag = new TagModel();
	            newTag.set({ label : item.toLowerCase() });
	            tagCollection.add(newTag);
	
	            newTag.save().done(function() {
	                item = newTag.toJSON();
	                originalAdd.call(self, item, dontPushVal);
	            });
	        }
	    } else {
	        originalAdd.call(self, item, dontPushVal);
	    }
	
	    self.$input.typeahead('val', '');
	};
	
	$.fn.tagsinput.Constructor.prototype.remove = function(item, dontPushVal) {
	    if (item === null) {
	        return;
	    }
	
	    originalRemove.call(this, item, dontPushVal);
	};
	
	$.fn.tagsinput.Constructor.prototype.build = function(options) {
	    var self = this;
	    var defaults = {
	        confirmKeys : [
	            9,
	            13,
	            32,
	            44,
	            59
	        ] //tab, enter, space, comma, semi-colon
	    };
	
	    options = $.extend({}, defaults, options);
	
	    self.$input.on('keydown', function(event) {
	        if (event.which === 9) {
	            var e = $.Event('keypress');
	            e.which = 9;
	            self.$input.trigger(e);
	            event.preventDefault();
	        }
	    });
	
	    self.$input.on('focusout', function() {
	        self.add(self.$input.val());
	        self.$input.val('');
	    });
	
	    originalBuild.call(this, options);
	};
	
	$.fn.tagInput = function(options) {
	    options = $.extend({}, { allowNew : true }, options);
	
	    var input = this;
	    var model = options.model;
	    var property = options.property;
	
	    var tagInput = $(this).tagsinput({
	        tagCollection : TagCollection,
	        freeInput     : true,
	        allowNew      : options.allowNew,
	        itemValue     : 'id',
	        itemText      : 'label',
	        trimValue     : true,
	        typeaheadjs   : {
	            name       : 'tags',
	            displayKey : 'label',
	            source     : substringMatcher(TagCollection)
	        }
	    });
	
	    //Override the free input being set to false because we're using objects
	    $(tagInput)[0].options.freeInput = true;
	
	    if (model) {
	        var tags = getExistingTags(model.get(property));
	
	        //Remove any existing tags and re-add them
	        $(this).tagsinput('removeAll');
	        _.each(tags, function(tag) {
	            $(input).tagsinput('add', tag);
	        });
	        $(this).tagsinput('refresh');
	        $(this).on('itemAdded', function(event) {
	            var tags = model.get(property);
	            tags.push(event.item.id);
	            model.set(property, tags);
	        });
	        $(this).on('itemRemoved', function(event) {
	            if (!event.item) {
	                return;
	            }
	            var tags = _.without(model.get(property), event.item.id);
	            model.set(property, tags);
	        });
	    }
	};

/***/ },
/* 259 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var TagModel = __webpack_require__(260);
	var ApiData = __webpack_require__(23);
	
	var Collection = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/tag',
	    model : TagModel,
	
	    comparator : function(model) {
	        return model.get('label');
	    }
	});
	
	module.exports = new Collection(ApiData.get('tag'));


/***/ },
/* 260 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 261 */,
/* 262 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 263 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var DelayProfileModel = __webpack_require__(262);
	
	module.exports = Backbone.Collection.extend({
	    model : DelayProfileModel,
	    url   : window.NzbDrone.ApiRoot + '/delayprofile'
	});

/***/ },
/* 264 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var QualityDefinitionCollection = __webpack_require__(265);
	var QualityDefinitionCollectionView = __webpack_require__(267);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Settings/Quality/QualityLayoutTemplate',
	
	    regions : {
	        qualityDefinition : '#quality-definition'
	    },
	
	    initialize : function(options) {
	        this.settings = options.settings;
	        this.qualityDefinitionCollection = new QualityDefinitionCollection();
	        this.qualityDefinitionCollection.fetch();
	    },
	
	    onShow : function() {
	        this.qualityDefinition.show(new QualityDefinitionCollectionView({ collection : this.qualityDefinitionCollection }));
	    }
	});

/***/ },
/* 265 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var QualityDefinitionModel = __webpack_require__(266);
	
	module.exports = Backbone.Collection.extend({
	    model : QualityDefinitionModel,
	    url   : window.NzbDrone.ApiRoot + '/qualitydefinition'
	});

/***/ },
/* 266 */
/***/ function(module, exports, __webpack_require__) {

	var ModelBase = __webpack_require__(210);
	
	module.exports = ModelBase.extend({
	    baseInitialize : ModelBase.prototype.initialize,
	
	    initialize : function() {
	        var name = this.get('quality').name;
	
	        this.successMessage = 'Saved ' + name + ' quality settings';
	        this.errorMessage = 'Couldn\'t save ' + name + ' quality settings';
	
	        this.baseInitialize.call(this);
	    }
	});

/***/ },
/* 267 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var QualityDefinitionItemView = __webpack_require__(268);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'Settings/Quality/Definition/QualityDefinitionCollectionTemplate',
	
	    itemViewContainer : '.x-rows',
	
	    itemView : QualityDefinitionItemView
	});

/***/ },
/* 268 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	__webpack_require__(269);
	var FormatHelpers = __webpack_require__(20);
	
	var view = Marionette.ItemView.extend({
	    template  : 'Settings/Quality/Definition/QualityDefinitionItemViewTemplate',
	    className : 'row',
	    
	    slider    : {
	        min  : 0,
	        max  : 200,
	        step : 0.1
	    },
	
	    ui : {
	        sizeSlider          : '.x-slider',
	        thirtyMinuteMinSize : '.x-min-thirty',
	        sixtyMinuteMinSize  : '.x-min-sixty',
	        thirtyMinuteMaxSize : '.x-max-thirty',
	        sixtyMinuteMaxSize  : '.x-max-sixty'
	    },
	
	    events : {
	        'slide .x-slider' : '_updateSize'
	    },
	
	    initialize : function(options) {
	        this.profileCollection = options.profiles;
	    },
	
	    onRender : function() {
	        if (this.model.get('quality').id === 0) {
	            this.$el.addClass('row advanced-setting');
	        }
	
	        this.ui.sizeSlider.slider({
	            range  : true,
	            min    : this.slider.min,
	            max    : this.slider.max,
	            step   : this.slider.step,
	            values : [
	                this.model.get('minSize') || this.slider.min,
	                this.model.get('maxSize') || this.slider.max
	            ]
	        });
	
	        this._changeSize();
	    },
	
	    _updateSize : function(event, ui) {
	        var minSize = ui.values[0];
	        var maxSize = ui.values[1];
	    
	        if (maxSize === this.slider.max) {
	            maxSize = null;
	        }
	    
	        this.model.set('minSize', minSize);
	        this.model.set('maxSize', maxSize);
	
	        this._changeSize();
	    },
	
	    _changeSize : function() {
	        var minSize = this.model.get('minSize') || this.slider.min;
	        var maxSize = this.model.get('maxSize') || null;
	        {
	            var minBytes = minSize * 1024 * 1024;
	            var minThirty = FormatHelpers.bytes(minBytes * 30, 2);
	            var minSixty = FormatHelpers.bytes(minBytes * 60, 2);
	
	            this.ui.thirtyMinuteMinSize.html(minThirty);
	            this.ui.sixtyMinuteMinSize.html(minSixty);
	        }
	
	        {
	            if (maxSize === 0 || maxSize === null) {
	                this.ui.thirtyMinuteMaxSize.html('Unlimited');
	                this.ui.sixtyMinuteMaxSize.html('Unlimited');
	            } else {
	                var maxBytes = maxSize * 1024 * 1024;
	                var maxThirty = FormatHelpers.bytes(maxBytes * 30, 2);
	                var maxSixty = FormatHelpers.bytes(maxBytes * 60, 2);
	
	                this.ui.thirtyMinuteMaxSize.html(maxThirty);
	                this.ui.sixtyMinuteMaxSize.html(maxSixty);
	            }
	        }
	    }
	});
	
	view = AsModelBoundView.call(view);
	
	module.exports = view;

/***/ },
/* 269 */,
/* 270 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var IndexerCollection = __webpack_require__(271);
	var CollectionView = __webpack_require__(274);
	var OptionsView = __webpack_require__(285);
	var RestrictionCollection = __webpack_require__(286);
	var RestrictionCollectionView = __webpack_require__(288);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Settings/Indexers/IndexerLayoutTemplate',
	
	    regions : {
	        indexers       : '#x-indexers-region',
	        indexerOptions : '#x-indexer-options-region',
	        restriction    : '#x-restriction-region'
	    },
	
	    initialize : function() {
	        this.indexersCollection = new IndexerCollection();
	        this.indexersCollection.fetch();
	
	        this.restrictionCollection = new RestrictionCollection();
	        this.restrictionCollection.fetch();
	    },
	
	    onShow : function() {
	        this.indexers.show(new CollectionView({ collection : this.indexersCollection }));
	        this.indexerOptions.show(new OptionsView({ model : this.model }));
	        this.restriction.show(new RestrictionCollectionView({ collection : this.restrictionCollection }));
	    }
	});

/***/ },
/* 271 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var IndexerModel = __webpack_require__(272);
	
	module.exports = Backbone.Collection.extend({
	    model : IndexerModel,
	    url   : window.NzbDrone.ApiRoot + '/indexer',
	
	    comparator : function(left, right, collection) {
	        var result = 0;
	
	        if (left.get('protocol')) {
	            result = -left.get('protocol').localeCompare(right.get('protocol'));
	        }
	
	        if (result === 0 && left.get('name')) {
	            result = left.get('name').localeCompare(right.get('name'));
	        }
	
	        if (result === 0) {
	            result = left.get('implementation').localeCompare(right.get('implementation'));
	        }
	
	        return result;
	    }
	});

/***/ },
/* 272 */
/***/ function(module, exports, __webpack_require__) {

	var ProviderSettingsModelBase = __webpack_require__(273);
	
	module.exports = ProviderSettingsModelBase.extend({});

/***/ },
/* 273 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var DeepModel = __webpack_require__(46);
	var Messenger = __webpack_require__(55);
	
	module.exports = DeepModel.extend({
	
	    getFieldValue : function(name) {
	        var index = _.indexOf(_.pluck(this.get('fields'), 'name'), name);
	        return this.get('fields.' + index + '.value');
	    },
	
	    setFieldValue : function(name, value) {
	        var index = _.indexOf(_.pluck(this.get('fields'), 'name'), name);
	        return this.set('fields.' + index + '.value', value);
	    },
	
	    requestAction : function(action, queryParams) {
	        var self = this;
	
	        this.trigger('validation:sync');
	
	        var params = {
	            url             : this.collection.url + '/action/' + action,
	            contentType     : 'application/json',
	            data            : JSON.stringify(this.toJSON()),
	            type            : 'POST',
	            isValidatedCall : true
	        };
	
	        if (queryParams) {
	            params.url += '?' + $.param(queryParams, true);
	        }
	
	        var promise = $.ajax(params);
	
	        promise.fail(function(response) {
	            self.trigger('validation:failed', response);
	        });
	
	        return promise;
	    },
	
	    test : function() {
	        var self = this;
	
	        this.trigger('validation:sync');
	
	        var params = {};
	
	        params.url = this.collection.url + '/test';
	        params.contentType = 'application/json';
	        params.data = JSON.stringify(this.toJSON());
	        params.type = 'POST';
	        params.isValidatedCall = true;
	
	        var promise = $.ajax(params);
	
	        Messenger.monitor({
	            promise        : promise,
	            successMessage : 'Testing \'{0}\' succeeded'.format(this.get('name')),
	            errorMessage   : 'Testing \'{0}\' failed'.format(this.get('name'))
	        });
	
	        promise.fail(function(response) {
	            self.trigger('validation:failed', response);
	        });
	
	        return promise;
	    }
	});

/***/ },
/* 274 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ItemView = __webpack_require__(275);
	var SchemaModal = __webpack_require__(280);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : ItemView,
	    itemViewContainer : '.indexer-list',
	    template          : 'Settings/Indexers/IndexerCollectionViewTemplate',
	
	    ui : {
	        'addCard' : '.x-add-card'
	    },
	
	    events : {
	        'click .x-add-card' : '_openSchemaModal'
	    },
	
	    appendHtml : function(collectionView, itemView, index) {
	        collectionView.ui.addCard.parent('li').before(itemView.el);
	    },
	
	    _openSchemaModal : function() {
	        SchemaModal.open(this.collection);
	    }
	});

/***/ },
/* 275 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(276);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/Indexers/IndexerItemViewTemplate',
	    tagName  : 'li',
	
	    events : {
	        'click' : '_edit'
	    },
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this.render);
	    },
	
	    _edit : function() {
	        var view = new EditView({
	            model            : this.model,
	            targetCollection : this.model.collection
	        });
	        AppLayout.modalRegion.show(view);
	    }
	});

/***/ },
/* 276 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var DeleteView = __webpack_require__(277);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	__webpack_require__(278);
	__webpack_require__(227);
	__webpack_require__(73);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Indexers/Edit/IndexerEditViewTemplate',
	
	    events : {
	        'click .x-back'            : '_back',
	        'click .x-captcha-refresh' : '_onRefreshCaptcha'
	    },
	
	    _deleteView : DeleteView,
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    _onAfterSave : function() {
	        this.targetCollection.add(this.model, { merge : true });
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _onAfterSaveAndAdd : function() {
	        this.targetCollection.add(this.model, { merge : true });
	
	        __webpack_require__(280).open(this.targetCollection);
	    },
	
	    _back : function() {
	        if (this.model.isNew()) {
	            this.model.destroy();
	        }
	
	        __webpack_require__(280).open(this.targetCollection);
	    },
	
	    _onRefreshCaptcha : function(event) {
	        var self = this;
	
	        var target = $(event.target).parents('.input-group');
	
	        this.ui.indicator.show();
	
	        this.model.requestAction("checkCaptcha")
	            .then(function(result) {
	                if (!result.captchaRequest) {
	                    self.model.setFieldValue('CaptchaToken', '');
	
	                    return result;
	                }
	
	                return self._showCaptcha(target, result.captchaRequest);
	            })
	            .always(function() {
	                self.ui.indicator.hide();
	            });
	    },
	
	    _showCaptcha : function(target, captchaRequest) {
	        var self = this;
	
	        var widget = $('<div class="g-recaptcha"></div>').insertAfter(target);
	
	        return this._loadRecaptchaWidget(widget[0], captchaRequest.siteKey, captchaRequest.secretToken)
	            .then(function(captchaResponse) {
	                target.parents('.form-group').removeAllErrors();
	                widget.remove();
	
	                var queryParams = {
	                    responseUrl    : captchaRequest.responseUrl,
	                    ray            : captchaRequest.ray,
	                    captchaResponse: captchaResponse
	                };
	
	                return self.model.requestAction("getCaptchaCookie", queryParams);
	            })
	            .then(function(response) {
	                self.model.setFieldValue('CaptchaToken', response.captchaToken);
	            });
	    },
	
	    _loadRecaptchaWidget : function(widget, sitekey, stoken) {
	        var promise = $.Deferred();
	
	        var renderWidget = function() {
	            window.grecaptcha.render(widget, {
	              'sitekey'  : sitekey,
	              'stoken'   : stoken,
	              'callback' : promise.resolve
	            });
	        };
	
	        if (window.grecaptcha) {
	            renderWidget();
	        } else {
	            window.grecaptchaLoadCallback = function() {
	                delete window.grecaptchaLoadCallback;
	                renderWidget();
	            };
	
	            $.getScript('https://www.google.com/recaptcha/api.js?onload=grecaptchaLoadCallback&render=explicit')
	             .fail(function() { promise.reject(); });
	        }
	
	        return promise;
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	
	module.exports = view;

/***/ },
/* 277 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/Indexers/Delete/IndexerDeleteViewTemplate',
	
	    events : {
	        'click .x-confirm-delete' : '_delete'
	    },
	
	    _delete : function() {
	        this.model.destroy({
	            wait    : true,
	            success : function() {
	                vent.trigger(vent.Commands.CloseModalCommand);
	            }
	        });
	    }
	});

/***/ },
/* 278 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Handlebars = __webpack_require__(14);
	var _ = __webpack_require__(8);
	__webpack_require__(279);
	
	var _templateRenderer = function(templateName) {
	    var templateFunction = Marionette.TemplateCache.get(templateName);
	    return new Handlebars.SafeString(templateFunction(this));
	};
	
	var _fieldBuilder = function(field) {
	    if (!field.type) {
	        return _templateRenderer.call(field, 'Form/TextboxTemplate');
	    }
	
	    if (field.type === 'hidden') {
	        return _templateRenderer.call(field, 'Form/HiddenTemplate');
	    }
	
	    if (field.type === 'url') {
	        return _templateRenderer.call(field, 'Form/UrlTemplate');
	    }
	
	    if (field.type === 'password') {
	        return _templateRenderer.call(field, 'Form/PasswordTemplate');
	    }
	
	    if (field.type === 'checkbox') {
	        return _templateRenderer.call(field, 'Form/CheckboxTemplate');
	    }
	
	    if (field.type === 'select') {
	        return _templateRenderer.call(field, 'Form/SelectTemplate');
	    }
	
	    if (field.type === 'hidden') {
	        return _templateRenderer.call(field, 'Form/HiddenTemplate');
	    }
	
	    if (field.type === 'path' || field.type === 'filepath') {
	        return _templateRenderer.call(field, 'Form/PathTemplate');
	    }
	
	    if (field.type === 'tag') {
	        return _templateRenderer.call(field, 'Form/TagTemplate');
	    }
	
	    if (field.type === 'action') {
	        return _templateRenderer.call(field, 'Form/ActionTemplate');
	    }
	
	    if (field.type === 'captcha') {
	        return _templateRenderer.call(field, 'Form/CaptchaTemplate');
	    }
	
	    return _templateRenderer.call(field, 'Form/TextboxTemplate');
	};
	
	Handlebars.registerHelper('formBuilder', function() {
	    var ret = '';
	    _.each(this.fields, function(field) {
	        ret += _fieldBuilder(field);
	    });
	
	    return new Handlebars.SafeString(ret);
	});


/***/ },
/* 279 */
/***/ function(module, exports, __webpack_require__) {

	var Handlebars = __webpack_require__(14);
	
	Handlebars.registerHelper('formMessage', function(message) {
	    if (!message) {
	        return '';
	    }
	
	    var level = message.type;
	
	    if (message.type === 'error') {
	        level = 'danger';
	    }
	
	    var messageHtml = '<div class="alert alert-{0}" role="alert">{1}</div>'.format(level, message.message);
	
	    return new Handlebars.SafeString(messageHtml);
	});

/***/ },
/* 280 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var AppLayout = __webpack_require__(70);
	var Backbone = __webpack_require__(6);
	var SchemaCollection = __webpack_require__(271);
	var AddCollectionView = __webpack_require__(281);
	
	module.exports = {
	    open : function(collection) {
	        var schemaCollection = new SchemaCollection();
	        var originalUrl = schemaCollection.url;
	        schemaCollection.url = schemaCollection.url + '/schema';
	        schemaCollection.fetch();
	        schemaCollection.url = originalUrl;
	
	        var groupedSchemaCollection = new Backbone.Collection();
	
	        schemaCollection.on('sync', function() {
	
	            var groups = schemaCollection.groupBy(function(model, iterator) {
	                return model.get('protocol');
	            });
	            var modelCollection = _.map(groups, function(values, key, list) {
	                return {
	                    "header"   : key,
	                    collection : values
	                };
	            });
	
	            groupedSchemaCollection.reset(modelCollection);
	        });
	
	        var view = new AddCollectionView({
	            collection       : groupedSchemaCollection,
	            targetCollection : collection
	        });
	
	        AppLayout.modalRegion.show(view);
	    }
	};

/***/ },
/* 281 */
/***/ function(module, exports, __webpack_require__) {

	var ThingyAddCollectionView = __webpack_require__(282);
	var ThingyHeaderGroupView = __webpack_require__(283);
	var AddItemView = __webpack_require__(284);
	
	module.exports = ThingyAddCollectionView.extend({
	    itemView          : ThingyHeaderGroupView.extend({ itemView : AddItemView }),
	    itemViewContainer : '.add-indexer .items',
	    template          : 'Settings/Indexers/Add/IndexerAddCollectionViewTemplate'
	});

/***/ },
/* 282 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    itemViewOptions : function() {
	        return {
	            targetCollection : this.targetCollection || this.options.targetCollection
	        };
	    },
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    }
	});

/***/ },
/* 283 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    itemViewContainer : '.item-list',
	    template          : 'Settings/ThingyHeaderGroupViewTemplate',
	    tagName           : 'div',
	
	    itemViewOptions : function() {
	        return {
	            targetCollection : this.targetCollection || this.options.targetCollection
	        };
	    },
	
	    initialize : function() {
	        this.collection = new Backbone.Collection(this.model.get('collection'));
	    }
	});

/***/ },
/* 284 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(276);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Settings/Indexers/Add/IndexerAddItemViewTemplate',
	    tagName   : 'li',
	    className : 'add-thingy-item',
	
	    events : {
	        'click .x-preset' : '_addPreset',
	        'click'           : '_add'
	    },
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    _addPreset : function(e) {
	        var presetName = $(e.target).closest('.x-preset').attr('data-id');
	        var presetData = _.where(this.model.get('presets'), { name : presetName })[0];
	
	        this.model.set(presetData);
	
	        this._openEdit();
	    },
	
	    _add : function(e) {
	        if ($(e.target).closest('.btn,.btn-group').length !== 0 && $(e.target).closest('.x-custom').length === 0) {
	            return;
	        }
	
	        this._openEdit();
	    },
	
	    _openEdit : function() {
	        this.model.set({
	            id           : undefined,
	            enableRss    : this.model.get('supportsRss'),
	            enableSearch : this.model.get('supportsSearch')
	        });
	
	        var editView = new EditView({
	            model            : this.model,
	            targetCollection : this.targetCollection
	        });
	
	        AppLayout.modalRegion.show(editView);
	    }
	});

/***/ },
/* 285 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Indexers/Options/IndexerOptionsViewTemplate'
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	
	module.exports = view;

/***/ },
/* 286 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var RestrictionModel = __webpack_require__(287);
	
	module.exports = Backbone.Collection.extend({
	    model : RestrictionModel,
	    url   : window.NzbDrone.ApiRoot + '/Restriction'
	});

/***/ },
/* 287 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var DeepModel = __webpack_require__(46);
	
	module.exports = DeepModel.extend({});

/***/ },
/* 288 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var RestrictionItemView = __webpack_require__(289);
	var EditView = __webpack_require__(290);
	__webpack_require__(292);
	__webpack_require__(73);
	
	module.exports = Marionette.CompositeView.extend({
	    template          : 'Settings/Indexers/Restriction/RestrictionCollectionViewTemplate',
	    itemViewContainer : '.x-rows',
	    itemView          : RestrictionItemView,
	
	    events : {
	        'click .x-add' : '_addMapping'
	    },
	
	    _addMapping : function() {
	        var model = this.collection.create({ tags : [] });
	        var view = new EditView({
	            model            : model,
	            targetCollection : this.collection
	        });
	
	        AppLayout.modalRegion.show(view);
	    }
	});

/***/ },
/* 289 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(290);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Settings/Indexers/Restriction/RestrictionItemViewTemplate',
	    className : 'row',
	
	    ui : {
	        tags : '.x-tags'
	    },
	
	    events : {
	        'click .x-edit' : '_edit'
	    },
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this.render);
	    },
	
	    _edit : function() {
	        var view = new EditView({
	            model            : this.model,
	            targetCollection : this.model.collection
	        });
	        AppLayout.modalRegion.show(view);
	    }
	});

/***/ },
/* 290 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var DeleteView = __webpack_require__(291);
	var CommandController = __webpack_require__(86);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	__webpack_require__(258);
	__webpack_require__(73);
	__webpack_require__(261);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Indexers/Restriction/RestrictionEditViewTemplate',
	
	    ui : {
	        required : '.x-required',
	        ignored  : '.x-ignored',
	        tags     : '.x-tags'
	    },
	
	    _deleteView : DeleteView,
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    onRender : function() {
	        this.ui.required.tagsinput({
	            trimValue : true,
	            tagClass  : 'label label-success'
	        });
	
	        this.ui.ignored.tagsinput({
	            trimValue : true,
	            tagClass  : 'label label-danger'
	        });
	
	        this.ui.tags.tagInput({
	            model    : this.model,
	            property : 'tags'
	        });
	    },
	
	    _onAfterSave : function() {
	        this.targetCollection.add(this.model, { merge : true });
	        vent.trigger(vent.Commands.CloseModalCommand);
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	module.exports = view;

/***/ },
/* 291 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/Indexers/Restriction/RestrictionDeleteViewTemplate',
	
	    events : {
	        'click .x-confirm-delete' : '_delete'
	    },
	
	    _delete : function() {
	        this.model.destroy({
	            wait    : true,
	            success : function() {
	                vent.trigger(vent.Commands.CloseModalCommand);
	            }
	        });
	    }
	});

/***/ },
/* 292 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Handlebars = __webpack_require__(14);
	var TagCollection = __webpack_require__(259);
	
	Handlebars.registerHelper('tagDisplay', function(tags) {
	    var tagLabels = _.map(TagCollection.filter(function(tag) {
	        return _.contains(tags, tag.get('id'));
	    }), function(tag) {
	        return '<span class="label label-info">{0}</span>'.format(tag.get('label'));
	    });
	
	    return new Handlebars.SafeString(tagLabels.join(' '));
	});
	
	Handlebars.registerHelper('genericTagDisplay', function(tags, classes) {
	    if (!tags) {
	        return new Handlebars.SafeString('');
	    }
	
	    var tagLabels = _.map(tags.split(','), function(tag) {
	        return '<span class="{0}">{1}</span>'.format(classes, tag);
	    });
	
	    return new Handlebars.SafeString(tagLabels.join(' '));
	});

/***/ },
/* 293 */
/***/ function(module, exports, __webpack_require__) {

	var SettingsModelBase = __webpack_require__(210);
	
	module.exports = SettingsModelBase.extend({
	    url            : window.NzbDrone.ApiRoot + '/config/indexer',
	    successMessage : 'Indexer settings saved',
	    errorMessage   : 'Failed to save indexer settings'
	});

/***/ },
/* 294 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var DownloadClientCollection = __webpack_require__(295);
	var DownloadClientCollectionView = __webpack_require__(297);
	var DownloadHandlingView = __webpack_require__(304);
	var DroneFactoryView = __webpack_require__(305);
	var RemotePathMappingCollection = __webpack_require__(306);
	var RemotePathMappingCollectionView = __webpack_require__(308);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Settings/DownloadClient/DownloadClientLayoutTemplate',
	
	    regions : {
	        downloadClients    : '#x-download-clients-region',
	        downloadHandling   : '#x-download-handling-region',
	        droneFactory       : '#x-dronefactory-region',
	        remotePathMappings : '#x-remotepath-mapping-region'
	    },
	
	    initialize : function() {
	        this.downloadClientsCollection = new DownloadClientCollection();
	        this.downloadClientsCollection.fetch();
	        this.remotePathMappingCollection = new RemotePathMappingCollection();
	        this.remotePathMappingCollection.fetch();
	    },
	
	    onShow : function() {
	        this.downloadClients.show(new DownloadClientCollectionView({ collection : this.downloadClientsCollection }));
	        this.downloadHandling.show(new DownloadHandlingView({ model : this.model }));
	        this.droneFactory.show(new DroneFactoryView({ model : this.model }));
	        this.remotePathMappings.show(new RemotePathMappingCollectionView({ collection : this.remotePathMappingCollection }));
	    }
	});

/***/ },
/* 295 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var DownloadClientModel = __webpack_require__(296);
	
	module.exports = Backbone.Collection.extend({
	    model : DownloadClientModel,
	    url   : window.NzbDrone.ApiRoot + '/downloadclient',
	
	    comparator : function(left, right, collection) {
	        var result = 0;
	
	        if (left.get('protocol')) {
	            result = -left.get('protocol').localeCompare(right.get('protocol'));
	        }
	
	        if (result === 0 && left.get('name')) {
	            result = left.get('name').localeCompare(right.get('name'));
	        }
	
	        if (result === 0) {
	            result = left.get('implementation').localeCompare(right.get('implementation'));
	        }
	
	        return result;
	    }
	});

/***/ },
/* 296 */
/***/ function(module, exports, __webpack_require__) {

	var ProviderSettingsModelBase = __webpack_require__(273);
	
	module.exports = ProviderSettingsModelBase.extend({});

/***/ },
/* 297 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ItemView = __webpack_require__(298);
	var SchemaModal = __webpack_require__(301);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : ItemView,
	    itemViewContainer : '.download-client-list',
	    template          : 'Settings/DownloadClient/DownloadClientCollectionViewTemplate',
	
	    ui : {
	        'addCard' : '.x-add-card'
	    },
	
	    events : {
	        'click .x-add-card' : '_openSchemaModal'
	    },
	
	    appendHtml : function(collectionView, itemView, index) {
	        collectionView.ui.addCard.parent('li').before(itemView.el);
	    },
	
	    _openSchemaModal : function() {
	        SchemaModal.open(this.collection);
	    }
	});

/***/ },
/* 298 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(299);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/DownloadClient/DownloadClientItemViewTemplate',
	    tagName  : 'li',
	
	    events : {
	        'click' : '_edit'
	    },
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this.render);
	    },
	
	    _edit : function() {
	        var view = new EditView({
	            model            : this.model,
	            targetCollection : this.model.collection
	        });
	        AppLayout.modalRegion.show(view);
	    }
	});

/***/ },
/* 299 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var DeleteView = __webpack_require__(300);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	__webpack_require__(278);
	__webpack_require__(228);
	__webpack_require__(73);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/DownloadClient/Edit/DownloadClientEditViewTemplate',
	
	    ui : {
	        path      : '.x-path',
	        modalBody : '.modal-body'
	    },
	
	    events : {
	        'click .x-back' : '_back'
	    },
	
	    _deleteView : DeleteView,
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    onShow : function() {
	        if (this.ui.path.length > 0) {
	            this.ui.modalBody.addClass('modal-overflow');
	        }
	
	        this.ui.path.fileBrowser();
	    },
	
	    _onAfterSave : function() {
	        this.targetCollection.add(this.model, { merge : true });
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _onAfterSaveAndAdd : function() {
	        this.targetCollection.add(this.model, { merge : true });
	
	        __webpack_require__(301).open(this.targetCollection);
	    },
	    _back              : function() {
	        __webpack_require__(301).open(this.targetCollection);
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	
	module.exports = view;

/***/ },
/* 300 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/DownloadClient/Delete/DownloadClientDeleteViewTemplate',
	
	    events : {
	        'click .x-confirm-delete' : '_delete'
	    },
	
	    _delete : function() {
	        this.model.destroy({
	            wait    : true,
	            success : function() {
	                vent.trigger(vent.Commands.CloseModalCommand);
	            }
	        });
	    }
	});

/***/ },
/* 301 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var AppLayout = __webpack_require__(70);
	var Backbone = __webpack_require__(6);
	var SchemaCollection = __webpack_require__(295);
	var AddCollectionView = __webpack_require__(302);
	
	module.exports = {
	    open : function(collection) {
	        var schemaCollection = new SchemaCollection();
	        var originalUrl = schemaCollection.url;
	        schemaCollection.url = schemaCollection.url + '/schema';
	        schemaCollection.fetch();
	        schemaCollection.url = originalUrl;
	
	        var groupedSchemaCollection = new Backbone.Collection();
	
	        schemaCollection.on('sync', function() {
	
	            var groups = schemaCollection.groupBy(function(model, iterator) {
	                return model.get('protocol');
	            });
	            var modelCollection = _.map(groups, function(values, key, list) {
	                return {
	                    'header'   : key,
	                    collection : values
	                };
	            });
	
	            groupedSchemaCollection.reset(modelCollection);
	        });
	
	        var view = new AddCollectionView({
	            collection       : groupedSchemaCollection,
	            targetCollection : collection
	        });
	
	        AppLayout.modalRegion.show(view);
	    }
	};

/***/ },
/* 302 */
/***/ function(module, exports, __webpack_require__) {

	var ThingyAddCollectionView = __webpack_require__(282);
	var ThingyHeaderGroupView = __webpack_require__(283);
	var AddItemView = __webpack_require__(303);
	
	module.exports = ThingyAddCollectionView.extend({
	    itemView          : ThingyHeaderGroupView.extend({ itemView : AddItemView }),
	    itemViewContainer : '.add-download-client .items',
	    template          : 'Settings/DownloadClient/Add/DownloadClientAddCollectionViewTemplate'
	});

/***/ },
/* 303 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(299);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Settings/DownloadClient/Add/DownloadClientAddItemViewTemplate',
	    tagName   : 'li',
	    className : 'add-thingy-item',
	
	    events : {
	        'click .x-preset' : '_addPreset',
	        'click'           : '_add'
	    },
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    _addPreset : function(e) {
	        var presetName = $(e.target).closest('.x-preset').attr('data-id');
	
	        var presetData = _.where(this.model.get('presets'), { name : presetName })[0];
	
	        this.model.set(presetData);
	
	        this.model.set({
	            id     : undefined,
	            enable : true
	        });
	
	        var editView = new EditView({
	            model            : this.model,
	            targetCollection : this.targetCollection
	        });
	
	        AppLayout.modalRegion.show(editView);
	    },
	
	    _add : function(e) {
	        if ($(e.target).closest('.btn,.btn-group').length !== 0 && $(e.target).closest('.x-custom').length === 0) {
	            return;
	        }
	
	        this.model.set({
	            id     : undefined,
	            enable : true
	        });
	
	        var editView = new EditView({
	            model            : this.model,
	            targetCollection : this.targetCollection
	        });
	
	        AppLayout.modalRegion.show(editView);
	    }
	});

/***/ },
/* 304 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/DownloadClient/DownloadHandling/DownloadHandlingViewTemplate',
	
	    ui : {
	        completedDownloadHandlingCheckbox : '.x-completed-download-handling',
	        completedDownloadOptions          : '.x-completed-download-options',
	        failedAutoRedownladCheckbox       : '.x-failed-auto-redownload',
	        failedDownloadOptions             : '.x-failed-download-options'
	    },
	
	    events : {
	        'change .x-completed-download-handling' : '_setCompletedDownloadOptionsVisibility',
	        'change .x-failed-auto-redownload'      : '_setFailedDownloadOptionsVisibility'
	    },
	
	    onRender : function() {
	        if (!this.ui.completedDownloadHandlingCheckbox.prop('checked')) {
	            this.ui.completedDownloadOptions.hide();
	        }
	        if (!this.ui.failedAutoRedownladCheckbox.prop('checked')) {
	            this.ui.failedDownloadOptions.hide();
	        }
	    },
	
	    _setCompletedDownloadOptionsVisibility : function() {
	        var checked = this.ui.completedDownloadHandlingCheckbox.prop('checked');
	        if (checked) {
	            this.ui.completedDownloadOptions.slideDown();
	        } else {
	            this.ui.completedDownloadOptions.slideUp();
	        }
	    },
	
	    _setFailedDownloadOptionsVisibility : function() {
	        var checked = this.ui.failedAutoRedownladCheckbox.prop('checked');
	        if (checked) {
	            this.ui.failedDownloadOptions.slideDown();
	        } else {
	            this.ui.failedDownloadOptions.slideUp();
	        }
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	module.exports = view;

/***/ },
/* 305 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	__webpack_require__(228);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/DownloadClient/DroneFactory/DroneFactoryViewTemplate',
	
	    ui : {
	        droneFactory : '.x-path'
	    },
	
	    onShow : function() {
	        this.ui.droneFactory.fileBrowser();
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	
	module.exports = view;

/***/ },
/* 306 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var RemotePathMappingModel = __webpack_require__(307);
	
	module.exports = Backbone.Collection.extend({
	    model : RemotePathMappingModel,
	    url   : window.NzbDrone.ApiRoot + '/remotePathMapping'
	});

/***/ },
/* 307 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var DeepModel = __webpack_require__(46);
	
	module.exports = DeepModel.extend({});

/***/ },
/* 308 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var RemotePathMappingItemView = __webpack_require__(309);
	var EditView = __webpack_require__(310);
	var RemotePathMappingModel = __webpack_require__(307);
	__webpack_require__(73);
	
	module.exports = Marionette.CompositeView.extend({
	    template          : 'Settings/DownloadClient/RemotePathMapping/RemotePathMappingCollectionViewTemplate',
	    itemViewContainer : '.x-rows',
	    itemView          : RemotePathMappingItemView,
	
	    events : {
	        'click .x-add' : '_addMapping'
	    },
	
	    _addMapping : function() {
	        var model = new RemotePathMappingModel();
	        model.collection = this.collection;
	
	        var view = new EditView({
	            model            : model,
	            targetCollection : this.collection
	        });
	
	        AppLayout.modalRegion.show(view);
	    }
	});

/***/ },
/* 309 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(310);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Settings/DownloadClient/RemotePathMapping/RemotePathMappingItemViewTemplate',
	    className : 'row',
	
	    events : {
	        'click .x-edit' : '_editMapping'
	    },
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this.render);
	    },
	
	    _editMapping : function() {
	        var view = new EditView({
	            model            : this.model,
	            targetCollection : this.model.collection
	        });
	
	        AppLayout.modalRegion.show(view);
	    }
	});

/***/ },
/* 310 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var DeleteView = __webpack_require__(311);
	var CommandController = __webpack_require__(86);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	__webpack_require__(228);
	__webpack_require__(73);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/DownloadClient/RemotePathMapping/RemotePathMappingEditViewTemplate',
	
	    ui : {
	        path      : '.x-path',
	        modalBody : '.modal-body'
	    },
	
	    _deleteView : DeleteView,
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    onShow : function() {
	        if (this.ui.path.length > 0) {
	            this.ui.modalBody.addClass('modal-overflow');
	        }
	
	        this.ui.path.fileBrowser();
	    },
	
	    _onAfterSave : function() {
	        this.targetCollection.add(this.model, { merge : true });
	        vent.trigger(vent.Commands.CloseModalCommand);
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	
	module.exports = view;

/***/ },
/* 311 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/DownloadClient/RemotePathMapping/RemotePathMappingDeleteViewTemplate',
	
	    events : {
	        'click .x-confirm-delete' : '_delete'
	    },
	
	    _delete : function() {
	        this.model.destroy({
	            wait    : true,
	            success : function() {
	                vent.trigger(vent.Commands.CloseModalCommand);
	            }
	        });
	    }
	});

/***/ },
/* 312 */
/***/ function(module, exports, __webpack_require__) {

	var SettingsModelBase = __webpack_require__(210);
	
	module.exports = SettingsModelBase.extend({
	    url            : window.NzbDrone.ApiRoot + '/config/downloadclient',
	    successMessage : 'Download client settings saved',
	    errorMessage   : 'Failed to save download client settings'
	});

/***/ },
/* 313 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var ItemView = __webpack_require__(314);
	var SchemaModal = __webpack_require__(317);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : ItemView,
	    itemViewContainer : '.notification-list',
	    template          : 'Settings/Notifications/NotificationCollectionViewTemplate',
	
	    ui : {
	        'addCard' : '.x-add-card'
	    },
	
	    events : {
	        'click .x-add-card' : '_openSchemaModal'
	    },
	
	    appendHtml : function(collectionView, itemView, index) {
	        collectionView.ui.addCard.parent('li').before(itemView.el);
	    },
	
	    _openSchemaModal : function() {
	        SchemaModal.open(this.collection);
	    }
	});

/***/ },
/* 314 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(315);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/Notifications/NotificationItemViewTemplate',
	    tagName  : 'li',
	
	    events : {
	        'click' : '_edit'
	    },
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this.render);
	    },
	
	    _edit : function() {
	        var view = new EditView({
	            model            : this.model,
	            targetCollection : this.model.collection
	        });
	        AppLayout.modalRegion.show(view);
	    }
	});

/***/ },
/* 315 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var DeleteView = __webpack_require__(316);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	__webpack_require__(278);
	__webpack_require__(258);
	__webpack_require__(228);
	__webpack_require__(261);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Notifications/Edit/NotificationEditViewTemplate',
	
	    ui : {
	        onDownloadToggle             : '.x-on-download',
	        onUpgradeSection             : '.x-on-upgrade',
	        tags                         : '.x-tags',
	        modalBody                    : '.x-modal-body',
	        formTag                      : '.x-form-tag',
	        path                         : '.x-path',
	        authorizedNotificationButton : '.AuthorizeNotification'
	    },
	
	    events : {
	        'click .x-back'         : '_back',
	        'change .x-on-download' : '_onDownloadChanged',
	        'click .AuthorizeNotification' : '_onAuthorizeNotification'
	    },
	
	    _deleteView : DeleteView,
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    onRender : function() {
	        this._onDownloadChanged();
	
	        this.ui.tags.tagInput({
	            model    : this.model,
	            property : 'tags'
	        });
	
	        this.ui.formTag.tagsinput({
	            trimValue : true,
	            tagClass  : 'label label-default'
	        });
	    },
	
	    onShow : function() {
	        if (this.ui.path.length > 0) {
	            this.ui.modalBody.addClass('modal-overflow');
	        }
	
	        this.ui.path.fileBrowser();
	    },
	
	    _onAfterSave : function() {
	        this.targetCollection.add(this.model, { merge : true });
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _onAfterSaveAndAdd : function() {
	        this.targetCollection.add(this.model, { merge : true });
	
	        __webpack_require__(317).open(this.targetCollection);
	    },
	
	    _back : function() {
	        if (this.model.isNew()) {
	            this.model.destroy();
	        }
	
	        __webpack_require__(317).open(this.targetCollection);
	    },
	
	    _onDownloadChanged : function() {
	        var checked = this.ui.onDownloadToggle.prop('checked');
	
	        if (checked) {
	            this.ui.onUpgradeSection.show();
	        } else {
	            this.ui.onUpgradeSection.hide();
	        }
	    },
	
	    _onAuthorizeNotification : function() {
	        this.ui.indicator.show();
	
	        var self = this;
	
	        var promise = this.model.requestAction('startOAuth', { callbackUrl: window.location.origin + '/oauth.html' })
	            .then(function(response) {
	                return self._showOAuthWindow(response.oauthUrl);
	            })
	            .then(function(responseQueryParams) {
	                return self.model.requestAction('getOAuthToken', responseQueryParams);
	            })
	            .then(function(response) {
	                self.model.setFieldValue('AccessToken', response.accessToken);
	                self.model.setFieldValue('AccessTokenSecret', response.accessTokenSecret);
	            });
	            
	        promise.always(function() {
	                self.ui.indicator.hide();
	            });
	    },
	    
	    _showOAuthWindow : function(oauthUrl) {
	        var promise = $.Deferred();
	    
	        window.open(oauthUrl);
	        var selfWindow = window;
	        selfWindow.onCompleteOauth = function(query, callback) {
	            delete selfWindow.onCompleteOauth;
	
	            var queryParams = {};
	            var splitQuery = query.substring(1).split('&');
	            _.each(splitQuery, function (param) {
	                var paramSplit = param.split('=');
	                queryParams[paramSplit[0]] = paramSplit[1];
	            });
	
	            callback();
	
	            promise.resolve(queryParams);
	        };
	        
	        return promise;
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	
	module.exports = view;

/***/ },
/* 316 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Settings/Notifications/Delete/NotificationDeleteViewTemplate',
	
	    events  : {
	        'click .x-confirm-delete' : '_delete'
	    },
	    _delete : function() {
	        this.model.destroy({
	            wait    : true,
	            success : function() {
	                vent.trigger(vent.Commands.CloseModalCommand);
	            }
	        });
	    }
	});

/***/ },
/* 317 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var SchemaCollection = __webpack_require__(318);
	var AddCollectionView = __webpack_require__(320);
	
	module.exports = {
	    open : function(collection) {
	        var schemaCollection = new SchemaCollection();
	        var originalUrl = schemaCollection.url;
	        schemaCollection.url = schemaCollection.url + '/schema';
	        schemaCollection.fetch();
	        schemaCollection.url = originalUrl;
	        var view = new AddCollectionView({
	            collection       : schemaCollection,
	            targetCollection : collection
	        });
	        AppLayout.modalRegion.show(view);
	    }
	};

/***/ },
/* 318 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var NotificationModel = __webpack_require__(319);
	
	module.exports = Backbone.Collection.extend({
	    model : NotificationModel,
	    url   : window.NzbDrone.ApiRoot + '/notification'
	});

/***/ },
/* 319 */
/***/ function(module, exports, __webpack_require__) {

	var ProviderSettingsModelBase = __webpack_require__(273);
	
	module.exports = ProviderSettingsModelBase.extend({});

/***/ },
/* 320 */
/***/ function(module, exports, __webpack_require__) {

	var ThingyAddCollectionView = __webpack_require__(282);
	var AddItemView = __webpack_require__(321);
	
	module.exports = ThingyAddCollectionView.extend({
	    itemView          : AddItemView,
	    itemViewContainer : '.add-notifications .items',
	    template          : 'Settings/Notifications/Add/NotificationAddCollectionViewTemplate'
	});

/***/ },
/* 321 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(315);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'Settings/Notifications/Add/NotificationAddItemViewTemplate',
	    tagName   : 'li',
	    className : 'add-thingy-item',
	
	    events : {
	        'click .x-preset' : '_addPreset',
	        'click'           : '_add'
	    },
	
	    initialize : function(options) {
	        this.targetCollection = options.targetCollection;
	    },
	
	    _addPreset : function(e) {
	        var presetName = $(e.target).closest('.x-preset').attr('data-id');
	
	        var presetData = _.where(this.model.get('presets'), { name : presetName })[0];
	
	        this.model.set(presetData);
	
	        this.model.set({
	            id         : undefined,
	            onGrab     : this.model.get('supportsOnGrab'),
	            onDownload : this.model.get('supportsOnDownload'),
	            onUpgrade  : this.model.get('supportsOnUpgrade'),
	            onRename   : this.model.get('supportsOnRename')
	        });
	
	        var editView = new EditView({
	            model            : this.model,
	            targetCollection : this.targetCollection
	        });
	
	        AppLayout.modalRegion.show(editView);
	    },
	
	    _add : function(e) {
	        if ($(e.target).closest('.btn,.btn-group').length !== 0 && $(e.target).closest('.x-custom').length === 0) {
	            return;
	        }
	
	        this.model.set({
	            id         : undefined,
	            onGrab     : this.model.get('supportsOnGrab'),
	            onDownload : this.model.get('supportsOnDownload'),
	            onUpgrade  : this.model.get('supportsOnUpgrade'),
	            onRename   : this.model.get('supportsOnRename')
	        });
	
	        var editView = new EditView({
	            model            : this.model,
	            targetCollection : this.targetCollection
	        });
	
	        AppLayout.modalRegion.show(editView);
	    }
	});

/***/ },
/* 322 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var MetadataCollection = __webpack_require__(323);
	var MetadataCollectionView = __webpack_require__(325);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Settings/Metadata/MetadataLayoutTemplate',
	
	    regions : {
	        metadata : '#x-metadata-providers'
	    },
	
	    initialize : function(options) {
	        this.settings = options.settings;
	        this.metadataCollection = new MetadataCollection();
	        this.metadataCollection.fetch();
	    },
	    onShow     : function() {
	        this.metadata.show(new MetadataCollectionView({ collection : this.metadataCollection }));
	    }
	});

/***/ },
/* 323 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var MetadataModel = __webpack_require__(324);
	
	module.exports = Backbone.Collection.extend({
	    model : MetadataModel,
	    url   : window.NzbDrone.ApiRoot + '/metadata'
	});

/***/ },
/* 324 */
/***/ function(module, exports, __webpack_require__) {

	var ProviderSettingsModelBase = __webpack_require__(273);
	
	module.exports = ProviderSettingsModelBase.extend({});

/***/ },
/* 325 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var MetadataItemView = __webpack_require__(326);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : MetadataItemView,
	    itemViewContainer : '#x-metadata',
	    template          : 'Settings/Metadata/MetadataCollectionViewTemplate'
	});

/***/ },
/* 326 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditView = __webpack_require__(327);
	var AsModelBoundView = __webpack_require__(218);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Metadata/MetadataItemViewTemplate',
	    tagName  : 'li',
	
	    events : {
	        'click' : '_edit'
	    },
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this.render);
	    },
	
	    _edit : function() {
	        var view = new EditView({ model : this.model });
	        AppLayout.modalRegion.show(view);
	    }
	});
	
	module.exports = AsModelBoundView.call(view);

/***/ },
/* 327 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/Metadata/MetadataEditViewTemplate',
	
	    _onAfterSave : function() {
	        vent.trigger(vent.Commands.CloseModalCommand);
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	
	module.exports = view;

/***/ },
/* 328 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var CommandController = __webpack_require__(86);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	
	__webpack_require__(329);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/General/GeneralViewTemplate',
	
	    events : {
	        'change .x-auth'             : '_setAuthOptionsVisibility',
	        'change .x-proxy'            : '_setProxyOptionsVisibility',
	        'change .x-ssl'              : '_setSslOptionsVisibility',
	        'click .x-reset-api-key'     : '_resetApiKey',
	        'change .x-update-mechanism' : '_setScriptGroupVisibility'
	    },
	
	    ui : {
	        authToggle      : '.x-auth',
	        authOptions     : '.x-auth-options',
	        sslToggle       : '.x-ssl',
	        sslOptions      : '.x-ssl-options',
	        resetApiKey     : '.x-reset-api-key',
	        copyApiKey      : '.x-copy-api-key',
	        apiKeyInput     : '.x-api-key',
	        updateMechanism : '.x-update-mechanism',
	        scriptGroup     : '.x-script-group',
	        proxyToggle     : '.x-proxy',
	        proxyOptions    : '.x-proxy-settings'
	    },
	
	    initialize : function() {
	        this.listenTo(vent, vent.Events.CommandComplete, this._commandComplete);
	    },
	
	    onRender : function() {
	        if (this.ui.authToggle.val() === 'none') {
	            this.ui.authOptions.hide();
	        }
	
	        if (!this.ui.proxyToggle.prop('checked')) {
	            this.ui.proxyOptions.hide();
	        }
	
	        if (!this.ui.sslToggle.prop('checked')) {
	            this.ui.sslOptions.hide();
	        }
	
	        if (!this._showScriptGroup()) {
	            this.ui.scriptGroup.hide();
	        }
	
	        CommandController.bindToCommand({
	            element : this.ui.resetApiKey,
	            command : {
	                name : 'resetApiKey'
	            }
	        });
	    },
	
	    onShow : function() {
	        this.ui.copyApiKey.copyToClipboard(this.ui.apiKeyInput);
	    },
	
	    _setAuthOptionsVisibility : function() {
	
	        var showAuthOptions = this.ui.authToggle.val() !== 'none';
	
	        if (showAuthOptions) {
	            this.ui.authOptions.slideDown();
	        }
	
	        else {
	            this.ui.authOptions.slideUp();
	        }
	    },
	
	    _setProxyOptionsVisibility : function() {
	        if (this.ui.proxyToggle.prop('checked')) {
	            this.ui.proxyOptions.slideDown();
	        }
	        else {
	            this.ui.proxyOptions.slideUp();
	        }
	    },
	
	    _setSslOptionsVisibility : function() {
	
	        var showSslOptions = this.ui.sslToggle.prop('checked');
	
	        if (showSslOptions) {
	            this.ui.sslOptions.slideDown();
	        }
	
	        else {
	            this.ui.sslOptions.slideUp();
	        }
	    },
	
	    _resetApiKey : function() {
	        if (window.confirm('Reset API Key?')) {
	            CommandController.Execute('resetApiKey', {
	                name : 'resetApiKey'
	            });
	        }
	    },
	
	    _commandComplete : function(options) {
	        if (options.command.get('name') === 'resetapikey') {
	            this.model.fetch();
	        }
	    },
	
	    _setScriptGroupVisibility : function() {
	
	        if (this._showScriptGroup()) {
	            this.ui.scriptGroup.slideDown();
	        }
	
	        else {
	            this.ui.scriptGroup.slideUp();
	        }
	    },
	
	    _showScriptGroup : function() {
	        return this.ui.updateMechanism.val() === 'script';
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	
	module.exports = view;
	


/***/ },
/* 329 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var StatusModel = __webpack_require__(25);
	var ZeroClipboard = __webpack_require__(330);
	var Messenger = __webpack_require__(55);
	
	$.fn.copyToClipboard = function(input) {
	
	    ZeroClipboard.config({
	        swfPath : StatusModel.get('urlBase') + '/Content/zero.clipboard.swf'
	    });
	
	    var client = new ZeroClipboard(this);
	
	    client.on('ready', function(e) {
	        client.on('copy', function(e) {
	            e.clipboardData.setData("text/plain", input.val());
	        });
	        client.on('aftercopy', function() {
	            Messenger.show({ message : 'Copied text to clipboard' });
	        });
	    });
	};

/***/ },
/* 330 */,
/* 331 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var UiSettingsModel = __webpack_require__(22);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	
	var view = Marionette.ItemView.extend({
	    template : 'Settings/UI/UiViewTemplate',
	
	    initialize : function() {
	        this.listenTo(this.model, 'sync', this._reloadUiSettings);
	    },
	
	    _reloadUiSettings : function() {
	        UiSettingsModel.fetch();
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	
	module.exports = view;

/***/ },
/* 332 */
/***/ function(module, exports, __webpack_require__) {

	var SettingsModelBase = __webpack_require__(210);
	
	module.exports = SettingsModelBase.extend({
	    url            : window.NzbDrone.ApiRoot + '/config/ui',
	    successMessage : 'UI settings saved',
	    errorMessage   : 'Failed to save UI settings'
	});

/***/ },
/* 333 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var RootFolderLayout = __webpack_require__(334);
	var ExistingSeriesCollectionView = __webpack_require__(339);
	var AddSeriesView = __webpack_require__(340);
	var ProfileCollection = __webpack_require__(44);
	var RootFolderCollection = __webpack_require__(337);
	__webpack_require__(123);
	
	module.exports = Marionette.Layout.extend({
	    template : 'AddSeries/AddSeriesLayoutTemplate',
	
	    regions : {
	        workspace : '#add-series-workspace'
	    },
	
	    events : {
	        'click .x-import'  : '_importSeries',
	        'click .x-add-new' : '_addSeries'
	    },
	
	    attributes : {
	        id : 'add-series-screen'
	    },
	
	    initialize : function() {
	        ProfileCollection.fetch();
	        RootFolderCollection.fetch().done(function() {
	            RootFolderCollection.synced = true;
	        });
	    },
	
	    onShow : function() {
	        this.workspace.show(new AddSeriesView());
	    },
	
	    _folderSelected : function(options) {
	        vent.trigger(vent.Commands.CloseModalCommand);
	
	        this.workspace.show(new ExistingSeriesCollectionView({ model : options.model }));
	    },
	
	    _importSeries : function() {
	        this.rootFolderLayout = new RootFolderLayout();
	        this.listenTo(this.rootFolderLayout, 'folderSelected', this._folderSelected);
	        AppLayout.modalRegion.show(this.rootFolderLayout);
	    },
	
	    _addSeries : function() {
	        this.workspace.show(new AddSeriesView());
	    }
	});

/***/ },
/* 334 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var RootFolderCollectionView = __webpack_require__(335);
	var RootFolderCollection = __webpack_require__(337);
	var RootFolderModel = __webpack_require__(338);
	var LoadingView = __webpack_require__(117);
	var AsValidatedView = __webpack_require__(220);
	__webpack_require__(228);
	
	var Layout = Marionette.Layout.extend({
	    template : 'AddSeries/RootFolders/RootFolderLayoutTemplate',
	
	    ui : {
	        pathInput : '.x-path'
	    },
	
	    regions : {
	        currentDirs : '#current-dirs'
	    },
	
	    events : {
	        'click .x-add'          : '_addFolder',
	        'keydown .x-path input' : '_keydown'
	    },
	
	    initialize : function() {
	        this.collection = RootFolderCollection;
	        this.rootfolderListView = new RootFolderCollectionView({ collection : RootFolderCollection });
	
	        this.listenTo(this.rootfolderListView, 'itemview:folderSelected', this._onFolderSelected);
	    },
	
	    onShow : function() {
	        this.listenTo(RootFolderCollection, 'sync', this._showCurrentDirs);
	        this.currentDirs.show(new LoadingView());
	
	        if (RootFolderCollection.synced) {
	            this._showCurrentDirs();
	        }
	
	        this.ui.pathInput.fileBrowser();
	    },
	
	    _onFolderSelected : function(options) {
	        this.trigger('folderSelected', options);
	    },
	
	    _addFolder : function() {
	        var self = this;
	
	        var newDir = new RootFolderModel({
	            Path : this.ui.pathInput.val()
	        });
	
	        this.bindToModelValidation(newDir);
	
	        newDir.save().done(function() {
	            RootFolderCollection.add(newDir);
	            self.trigger('folderSelected', { model : newDir });
	        });
	    },
	
	    _showCurrentDirs : function() {
	        this.currentDirs.show(this.rootfolderListView);
	    },
	
	    _keydown : function(e) {
	        if (e.keyCode !== 13) {
	            return;
	        }
	
	        this._addFolder();
	    }
	});
	
	var Layout = AsValidatedView.apply(Layout);
	
	module.exports = Layout;

/***/ },
/* 335 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var RootFolderItemView = __webpack_require__(336);
	
	module.exports = Marionette.CompositeView.extend({
	    template          : 'AddSeries/RootFolders/RootFolderCollectionViewTemplate',
	    itemViewContainer : '.x-root-folders',
	    itemView          : RootFolderItemView
	});

/***/ },
/* 336 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'AddSeries/RootFolders/RootFolderItemViewTemplate',
	    className : 'recent-folder',
	    tagName   : 'tr',
	
	    initialize : function() {
	        this.listenTo(this.model, 'change', this.render);
	    },
	
	    events : {
	        'click .x-delete' : 'removeFolder',
	        'click .x-folder' : 'folderSelected'
	    },
	
	    removeFolder : function() {
	        var self = this;
	
	        this.model.destroy().success(function() {
	            self.close();
	        });
	    },
	
	    folderSelected : function() {
	        this.trigger('folderSelected', this.model);
	    }
	});

/***/ },
/* 337 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var RootFolderModel = __webpack_require__(338);
	__webpack_require__(39);
	
	var RootFolderCollection = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/rootfolder',
	    model : RootFolderModel
	});
	
	module.exports = new RootFolderCollection();

/***/ },
/* 338 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({
	    urlRoot  : window.NzbDrone.ApiRoot + '/rootfolder',
	    defaults : {
	        freeSpace : 0
	    }
	});

/***/ },
/* 339 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var AddSeriesView = __webpack_require__(340);
	var UnmappedFolderCollection = __webpack_require__(348);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : AddSeriesView,
	    itemViewContainer : '.x-loading-folders',
	    template          : 'AddSeries/Existing/AddExistingSeriesCollectionViewTemplate',
	
	    ui : {
	        loadingFolders : '.x-loading-folders'
	    },
	
	    initialize : function() {
	        this.collection = new UnmappedFolderCollection();
	        this.collection.importItems(this.model);
	    },
	
	    showCollection : function() {
	        this._showAndSearch(0);
	    },
	
	    appendHtml : function(collectionView, itemView, index) {
	        collectionView.ui.loadingFolders.before(itemView.el);
	    },
	
	    _showAndSearch : function(index) {
	        var self = this;
	        var model = this.collection.at(index);
	
	        if (model) {
	            var currentIndex = index;
	            var folderName = model.get('folder').name;
	            this.addItemView(model, this.getItemView(), index);
	            this.children.findByModel(model).search({ term : folderName }).always(function() {
	                if (!self.isClosed) {
	                    self._showAndSearch(currentIndex + 1);
	                }
	            });
	        }
	
	        else {
	            this.ui.loadingFolders.hide();
	        }
	    },
	
	    itemViewOptions : {
	        isExisting : true
	    }
	
	});

/***/ },
/* 340 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var AddSeriesCollection = __webpack_require__(341);
	var SearchResultCollectionView = __webpack_require__(342);
	var EmptyView = __webpack_require__(345);
	var NotFoundView = __webpack_require__(346);
	var ErrorView = __webpack_require__(347);
	var LoadingView = __webpack_require__(117);
	
	module.exports = Marionette.Layout.extend({
	    template : 'AddSeries/AddSeriesViewTemplate',
	
	    regions : {
	        searchResult : '#search-result'
	    },
	
	    ui : {
	        seriesSearch : '.x-series-search',
	        searchBar    : '.x-search-bar',
	        loadMore     : '.x-load-more'
	    },
	
	    events : {
	        'click .x-load-more' : '_onLoadMore'
	    },
	
	    initialize : function(options) {
	        this.isExisting = options.isExisting;
	        this.collection = new AddSeriesCollection();
	
	        if (this.isExisting) {
	            this.collection.unmappedFolderModel = this.model;
	        }
	
	        if (this.isExisting) {
	            this.className = 'existing-series';
	        } else {
	            this.className = 'new-series';
	        }
	
	        this.listenTo(vent, vent.Events.SeriesAdded, this._onSeriesAdded);
	        this.listenTo(this.collection, 'sync', this._showResults);
	
	        this.resultCollectionView = new SearchResultCollectionView({
	            collection : this.collection,
	            isExisting : this.isExisting
	        });
	
	        this.throttledSearch = _.debounce(this.search, 1000, { trailing : true }).bind(this);
	    },
	
	    onRender : function() {
	        var self = this;
	
	        this.$el.addClass(this.className);
	
	        this.ui.seriesSearch.keyup(function(e) {
	
	            if (_.contains([
	                    9,
	                    16,
	                    17,
	                    18,
	                    19,
	                    20,
	                    33,
	                    34,
	                    35,
	                    36,
	                    37,
	                    38,
	                    39,
	                    40,
	                    91,
	                    92,
	                    93
	                ], e.keyCode)) {
	                return;
	            }
	
	            self._abortExistingSearch();
	            self.throttledSearch({
	                term : self.ui.seriesSearch.val()
	            });
	        });
	
	        this._clearResults();
	
	        if (this.isExisting) {
	            this.ui.searchBar.hide();
	        }
	    },
	
	    onShow : function() {
	        this.ui.seriesSearch.focus();
	    },
	
	    search : function(options) {
	        var self = this;
	
	        this.collection.reset();
	
	        if (!options.term || options.term === this.collection.term) {
	            return Marionette.$.Deferred().resolve();
	        }
	
	        this.searchResult.show(new LoadingView());
	        this.collection.term = options.term;
	        this.currentSearchPromise = this.collection.fetch({
	            data : { term : options.term }
	        });
	
	        this.currentSearchPromise.fail(function() {
	            self._showError();
	        });
	
	        return this.currentSearchPromise;
	    },
	
	    _onSeriesAdded : function(options) {
	        if (this.isExisting && options.series.get('path') === this.model.get('folder').path) {
	            this.close();
	        }
	
	        else if (!this.isExisting) {
	            this.collection.term = '';
	            this.collection.reset();
	            this._clearResults();
	            this.ui.seriesSearch.val('');
	            this.ui.seriesSearch.focus();
	        }
	    },
	
	    _onLoadMore : function() {
	        var showingAll = this.resultCollectionView.showMore();
	        this.ui.searchBar.show();
	
	        if (showingAll) {
	            this.ui.loadMore.hide();
	        }
	    },
	
	    _clearResults : function() {
	        if (!this.isExisting) {
	            this.searchResult.show(new EmptyView());
	        } else {
	            this.searchResult.close();
	        }
	    },
	
	    _showResults : function() {
	        if (!this.isClosed) {
	            if (this.collection.length === 0) {
	                this.ui.searchBar.show();
	                this.searchResult.show(new NotFoundView({ term : this.collection.term }));
	            } else {
	                this.searchResult.show(this.resultCollectionView);
	                if (!this.showingAll && this.isExisting) {
	                    this.ui.loadMore.show();
	                }
	            }
	        }
	    },
	
	    _abortExistingSearch : function() {
	        if (this.currentSearchPromise && this.currentSearchPromise.readyState > 0 && this.currentSearchPromise.readyState < 4) {
	            console.log('aborting previous pending search request.');
	            this.currentSearchPromise.abort();
	        } else {
	            this._clearResults();
	        }
	    },
	
	    _showError : function() {
	        if (!this.isClosed) {
	            this.ui.searchBar.show();
	            this.searchResult.show(new ErrorView({ term : this.collection.term }));
	            this.collection.term = '';
	        }
	    }
	});

/***/ },
/* 341 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var SeriesModel = __webpack_require__(31);
	var _ = __webpack_require__(8);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/series/lookup',
	    model : SeriesModel,
	
	    parse : function(response) {
	        var self = this;
	
	        _.each(response, function(model) {
	            model.id = undefined;
	
	            if (self.unmappedFolderModel) {
	                model.path = self.unmappedFolderModel.get('folder').path;
	            }
	        });
	
	        return response;
	    }
	});

/***/ },
/* 342 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var SearchResultView = __webpack_require__(343);
	
	module.exports = Marionette.CollectionView.extend({
	    itemView : SearchResultView,
	
	    initialize : function(options) {
	        this.isExisting = options.isExisting;
	        this.showing = 1;
	    },
	
	    showAll : function() {
	        this.showingAll = true;
	        this.render();
	    },
	
	    showMore : function() {
	        this.showing += 5;
	        this.render();
	
	        return this.showing >= this.collection.length;
	    },
	
	    appendHtml : function(collectionView, itemView, index) {
	        if (!this.isExisting || index < this.showing || index === 0) {
	            collectionView.$el.append(itemView.el);
	        }
	    }
	});

/***/ },
/* 343 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var Profiles = __webpack_require__(44);
	var RootFolders = __webpack_require__(337);
	var RootFolderLayout = __webpack_require__(334);
	var SeriesCollection = __webpack_require__(123);
	var Config = __webpack_require__(35);
	var Messenger = __webpack_require__(55);
	var AsValidatedView = __webpack_require__(220);
	
	__webpack_require__(344);
	
	var view = Marionette.ItemView.extend({
	
	    template : 'AddSeries/SearchResultViewTemplate',
	
	    ui : {
	        profile         : '.x-profile',
	        rootFolder      : '.x-root-folder',
	        seasonFolder    : '.x-season-folder',
	        seriesType      : '.x-series-type',
	        monitor         : '.x-monitor',
	        monitorTooltip  : '.x-monitor-tooltip',
	        addButton       : '.x-add',
	        addSearchButton : '.x-add-search',
	        overview        : '.x-overview'
	    },
	
	    events : {
	        'click .x-add'            : '_addWithoutSearch',
	        'click .x-add-search'     : '_addAndSearch',
	        'change .x-profile'       : '_profileChanged',
	        'change .x-root-folder'   : '_rootFolderChanged',
	        'change .x-season-folder' : '_seasonFolderChanged',
	        'change .x-series-type'   : '_seriesTypeChanged',
	        'change .x-monitor'       : '_monitorChanged'
	    },
	
	    initialize : function() {
	
	        if (!this.model) {
	            throw 'model is required';
	        }
	
	        this.templateHelpers = {};
	        this._configureTemplateHelpers();
	
	        this.listenTo(vent, Config.Events.ConfigUpdatedEvent, this._onConfigUpdated);
	        this.listenTo(this.model, 'change', this.render);
	        this.listenTo(RootFolders, 'all', this._rootFoldersUpdated);
	    },
	
	    onRender : function() {
	
	        var defaultProfile = Config.getValue(Config.Keys.DefaultProfileId);
	        var defaultRoot = Config.getValue(Config.Keys.DefaultRootFolderId);
	        var useSeasonFolder = Config.getValueBoolean(Config.Keys.UseSeasonFolder, true);
	        var defaultSeriesType = Config.getValue(Config.Keys.DefaultSeriesType, 'standard');
	        var defaultMonitorEpisodes = Config.getValue(Config.Keys.MonitorEpisodes, 'missing');
	
	        if (Profiles.get(defaultProfile)) {
	            this.ui.profile.val(defaultProfile);
	        }
	
	        if (RootFolders.get(defaultRoot)) {
	            this.ui.rootFolder.val(defaultRoot);
	        }
	
	        this.ui.seasonFolder.prop('checked', useSeasonFolder);
	        this.ui.seriesType.val(defaultSeriesType);
	        this.ui.monitor.val(defaultMonitorEpisodes);
	
	        //TODO: make this work via onRender, FM?
	        //works with onShow, but stops working after the first render
	        this.ui.overview.dotdotdot({
	            height : 120
	        });
	
	        this.templateFunction = Marionette.TemplateCache.get('AddSeries/MonitoringTooltipTemplate');
	        var content = this.templateFunction();
	
	        this.ui.monitorTooltip.popover({
	            content   : content,
	            html      : true,
	            trigger   : 'hover',
	            title     : 'Episode Monitoring Options',
	            placement : 'right',
	            container : this.$el
	        });
	    },
	
	    _configureTemplateHelpers : function() {
	        var existingSeries = SeriesCollection.where({ tvdbId : this.model.get('tvdbId') });
	
	        if (existingSeries.length > 0) {
	            this.templateHelpers.existing = existingSeries[0].toJSON();
	        }
	
	        this.templateHelpers.profiles = Profiles.toJSON();
	
	        if (!this.model.get('isExisting')) {
	            this.templateHelpers.rootFolders = RootFolders.toJSON();
	        }
	    },
	
	    _onConfigUpdated : function(options) {
	        if (options.key === Config.Keys.DefaultProfileId) {
	            this.ui.profile.val(options.value);
	        }
	
	        else if (options.key === Config.Keys.DefaultRootFolderId) {
	            this.ui.rootFolder.val(options.value);
	        }
	
	        else if (options.key === Config.Keys.UseSeasonFolder) {
	            this.ui.seasonFolder.prop('checked', options.value);
	        }
	
	        else if (options.key === Config.Keys.DefaultSeriesType) {
	            this.ui.seriesType.val(options.value);
	        }
	
	        else if (options.key === Config.Keys.MonitorEpisodes) {
	            this.ui.monitor.val(options.value);
	        }
	    },
	
	    _profileChanged : function() {
	        Config.setValue(Config.Keys.DefaultProfileId, this.ui.profile.val());
	    },
	
	    _seasonFolderChanged : function() {
	        Config.setValue(Config.Keys.UseSeasonFolder, this.ui.seasonFolder.prop('checked'));
	    },
	
	    _rootFolderChanged : function() {
	        var rootFolderValue = this.ui.rootFolder.val();
	        if (rootFolderValue === 'addNew') {
	            var rootFolderLayout = new RootFolderLayout();
	            this.listenToOnce(rootFolderLayout, 'folderSelected', this._setRootFolder);
	            AppLayout.modalRegion.show(rootFolderLayout);
	        } else {
	            Config.setValue(Config.Keys.DefaultRootFolderId, rootFolderValue);
	        }
	    },
	
	    _seriesTypeChanged : function() {
	        Config.setValue(Config.Keys.DefaultSeriesType, this.ui.seriesType.val());
	    },
	
	    _monitorChanged : function() {
	        Config.setValue(Config.Keys.MonitorEpisodes, this.ui.monitor.val());
	    },
	
	    _setRootFolder : function(options) {
	        vent.trigger(vent.Commands.CloseModalCommand);
	        this.ui.rootFolder.val(options.model.id);
	        this._rootFolderChanged();
	    },
	
	    _addWithoutSearch : function() {
	        this._addSeries(false);
	    },
	
	    _addAndSearch : function() {
	        this._addSeries(true);
	    },
	
	    _addSeries : function(searchForMissingEpisodes) {
	        var addButton = this.ui.addButton;
	        var addSearchButton = this.ui.addSearchButton;
	
	        addButton.addClass('disabled');
	        addSearchButton.addClass('disabled');
	
	        var profile = this.ui.profile.val();
	        var rootFolderPath = this.ui.rootFolder.children(':selected').text();
	        var seriesType = this.ui.seriesType.val();
	        var seasonFolder = this.ui.seasonFolder.prop('checked');
	
	        var options = this._getAddSeriesOptions();
	        options.searchForMissingEpisodes = searchForMissingEpisodes;
	
	        this.model.set({
	            profileId      : profile,
	            rootFolderPath : rootFolderPath,
	            seasonFolder   : seasonFolder,
	            seriesType     : seriesType,
	            addOptions     : options,
	            monitored      : true
	        }, { silent : true });
	
	        var self = this;
	        var promise = this.model.save();
	
	        if (searchForMissingEpisodes) {
	            this.ui.addSearchButton.spinForPromise(promise);
	        }
	
	        else {
	            this.ui.addButton.spinForPromise(promise);
	        }
	
	        promise.always(function() {
	            addButton.removeClass('disabled');
	            addSearchButton.removeClass('disabled');
	        });
	
	        promise.done(function() {
	            SeriesCollection.add(self.model);
	
	            self.close();
	
	            Messenger.show({
	                message        : 'Added: ' + self.model.get('title'),
	                actions        : {
	                    goToSeries : {
	                        label  : 'Go to Series',
	                        action : function() {
	                            Backbone.history.navigate('/series/' + self.model.get('titleSlug'), { trigger : true });
	                        }
	                    }
	                },
	                hideAfter      : 8,
	                hideOnNavigate : true
	            });
	
	            vent.trigger(vent.Events.SeriesAdded, { series : self.model });
	        });
	    },
	
	    _rootFoldersUpdated : function() {
	        this._configureTemplateHelpers();
	        this.render();
	    },
	
	    _getAddSeriesOptions : function() {
	        var monitor = this.ui.monitor.val();
	        var lastSeason = _.max(this.model.get('seasons'), 'seasonNumber');
	        var firstSeason = _.min(_.reject(this.model.get('seasons'), { seasonNumber : 0 }), 'seasonNumber');
	
	        this.model.setSeasonPass(firstSeason.seasonNumber);
	
	        var options = {
	            ignoreEpisodesWithFiles    : false,
	            ignoreEpisodesWithoutFiles : false
	        };
	
	        if (monitor === 'all') {
	            return options;
	        }
	
	        else if (monitor === 'future') {
	            options.ignoreEpisodesWithFiles = true;
	            options.ignoreEpisodesWithoutFiles = true;
	        }
	
	        else if (monitor === 'latest') {
	            this.model.setSeasonPass(lastSeason.seasonNumber);
	        }
	
	        else if (monitor === 'first') {
	            this.model.setSeasonPass(lastSeason.seasonNumber + 1);
	            this.model.setSeasonMonitored(firstSeason.seasonNumber);
	        }
	
	        else if (monitor === 'missing') {
	            options.ignoreEpisodesWithFiles = true;
	        }
	
	        else if (monitor === 'existing') {
	            options.ignoreEpisodesWithoutFiles = true;
	        }
	
	        else if (monitor === 'none') {
	            this.model.setSeasonPass(lastSeason.seasonNumber + 1);
	        }
	
	        return options;
	    }
	});
	
	AsValidatedView.apply(view);
	
	module.exports = view;


/***/ },
/* 344 */,
/* 345 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'AddSeries/EmptyViewTemplate'
	});

/***/ },
/* 346 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'AddSeries/NotFoundViewTemplate',
	
	    initialize : function(options) {
	        this.options = options;
	    },
	
	    templateHelpers : function() {
	        return this.options;
	    }
	});

/***/ },
/* 347 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'AddSeries/ErrorViewTemplate',
	
	    initialize : function(options) {
	        this.options = options;
	    },
	
	    templateHelpers : function() {
	        return this.options;
	    }
	});

/***/ },
/* 348 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var UnmappedFolderModel = __webpack_require__(349);
	var _ = __webpack_require__(8);
	
	module.exports = Backbone.Collection.extend({
	    model : UnmappedFolderModel,
	
	    importItems : function(rootFolderModel) {
	
	        this.reset();
	        var rootFolder = rootFolderModel;
	
	        _.each(rootFolderModel.get('unmappedFolders'), function(folder) {
	            this.push(new UnmappedFolderModel({
	                rootFolder : rootFolder,
	                folder     : folder
	            }));
	        }, this);
	    }
	});

/***/ },
/* 349 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 350 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var RootFolderLayout = __webpack_require__(351);
	var ExistingMoviesCollectionView = __webpack_require__(356);
	var AddMoviesView = __webpack_require__(357);
	var ProfileCollection = __webpack_require__(44);
	var RootFolderCollection = __webpack_require__(354);
	__webpack_require__(64);
	
	module.exports = Marionette.Layout.extend({
	    template : 'AddMovies/AddMoviesLayoutTemplate',
	
	    regions : {
	        workspace : '#add-movies-workspace'
	    },
	
	    events : {
	        'click .x-import'  : '_importMovies',
	        'click .x-add-new' : '_addMovies'
	    },
	
	    attributes : {
	        id : 'add-movies-screen'
	    },
	
	    initialize : function() {
	        ProfileCollection.fetch();
	        RootFolderCollection.fetch().done(function() {
	            RootFolderCollection.synced = true;
	        });
	    },
	
	    onShow : function() {
	        this.workspace.show(new AddMoviesView());
	    },
	
	    _folderSelected : function(options) {
	        vent.trigger(vent.Commands.CloseModalCommand);
	        //TODO: Fix this shit.
	        this.workspace.show(new ExistingMoviesCollectionView({ model : options.model }));
	    },
	
	    _importMovies : function() {
	        this.rootFolderLayout = new RootFolderLayout();
	        this.listenTo(this.rootFolderLayout, 'folderSelected', this._folderSelected);
	        AppLayout.modalRegion.show(this.rootFolderLayout);
	    },
	
	    _addMovies : function() {
	        this.workspace.show(new AddMoviesView());
	    }
	});


/***/ },
/* 351 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var RootFolderCollectionView = __webpack_require__(352);
	var RootFolderCollection = __webpack_require__(354);
	var RootFolderModel = __webpack_require__(355);
	var LoadingView = __webpack_require__(117);
	var AsValidatedView = __webpack_require__(220);
	__webpack_require__(228);
	
	var Layout = Marionette.Layout.extend({
	    template : 'AddMovies/RootFolders/RootFolderLayoutTemplate',
	
	    ui : {
	        pathInput : '.x-path'
	    },
	
	    regions : {
	        currentDirs : '#current-dirs'
	    },
	
	    events : {
	        'click .x-add'          : '_addFolder',
	        'keydown .x-path input' : '_keydown'
	    },
	
	    initialize : function() {
	        this.collection = RootFolderCollection;
	        this.rootfolderListView = new RootFolderCollectionView({ collection : RootFolderCollection });
	
	        this.listenTo(this.rootfolderListView, 'itemview:folderSelected', this._onFolderSelected);
	    },
	
	    onShow : function() {
	        this.listenTo(RootFolderCollection, 'sync', this._showCurrentDirs);
	        this.currentDirs.show(new LoadingView());
	
	        if (RootFolderCollection.synced) {
	            this._showCurrentDirs();
	        }
	
	        this.ui.pathInput.fileBrowser();
	    },
	
	    _onFolderSelected : function(options) {
	        this.trigger('folderSelected', options);
	    },
	
	    _addFolder : function() {
	        var self = this;
	
	        var newDir = new RootFolderModel({
	            Path : this.ui.pathInput.val()
	        });
	
	        this.bindToModelValidation(newDir);
	
	        newDir.save().done(function() {
	            RootFolderCollection.add(newDir);
	            self.trigger('folderSelected', { model : newDir });
	        });
	    },
	
	    _showCurrentDirs : function() {
	        this.currentDirs.show(this.rootfolderListView);
	    },
	
	    _keydown : function(e) {
	        if (e.keyCode !== 13) {
	            return;
	        }
	
	        this._addFolder();
	    }
	});
	
	var Layout = AsValidatedView.apply(Layout);
	
	module.exports = Layout;

/***/ },
/* 352 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var RootFolderItemView = __webpack_require__(353);
	
	module.exports = Marionette.CompositeView.extend({
	    template          : 'AddMovies/RootFolders/RootFolderCollectionViewTemplate',
	    itemViewContainer : '.x-root-folders',
	    itemView          : RootFolderItemView
	});

/***/ },
/* 353 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'AddMovies/RootFolders/RootFolderItemViewTemplate',
	    className : 'recent-folder',
	    tagName   : 'tr',
	
	    initialize : function() {
	        this.listenTo(this.model, 'change', this.render);
	    },
	
	    events : {
	        'click .x-delete' : 'removeFolder',
	        'click .x-folder' : 'folderSelected'
	    },
	
	    removeFolder : function() {
	        var self = this;
	
	        this.model.destroy().success(function() {
	            self.close();
	        });
	    },
	
	    folderSelected : function() {
	        this.trigger('folderSelected', this.model);
	    }
	});

/***/ },
/* 354 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var RootFolderModel = __webpack_require__(355);
	__webpack_require__(39);
	
	var RootFolderCollection = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/rootfolder',
	    model : RootFolderModel
	});
	
	module.exports = new RootFolderCollection();

/***/ },
/* 355 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({
	    urlRoot  : window.NzbDrone.ApiRoot + '/rootfolder',
	    defaults : {
	        freeSpace : 0
	    }
	});

/***/ },
/* 356 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var AddMoviesView = __webpack_require__(357);
	var UnmappedFolderCollection = __webpack_require__(364);
	
	module.exports = Marionette.CompositeView.extend({
	    itemView          : AddMoviesView,
	    itemViewContainer : '.x-loading-folders',
	    template          : 'AddMovies/Existing/AddExistingMovieCollectionViewTemplate',
	
	    ui : {
	        loadingFolders : '.x-loading-folders'
	    },
	
	    initialize : function() {
	        this.collection = new UnmappedFolderCollection();
	        this.collection.importItems(this.model);
	    },
	
	    showCollection : function() {
	        this._showAndSearch(0);
	    },
	
	    appendHtml : function(collectionView, itemView, index) {
	        collectionView.ui.loadingFolders.before(itemView.el);
	    },
	
	    _showAndSearch : function(index) {
	        var self = this;
	        var model = this.collection.at(index);
	
	        if (model) {
	            var currentIndex = index;
	            var folderName = model.get('folder').name;
	            this.addItemView(model, this.getItemView(), index);
	            this.children.findByModel(model).search({ term : folderName }).always(function() {
	                if (!self.isClosed) {
	                    self._showAndSearch(currentIndex + 1);
	                }
	            });
	        }
	
	        else {
	            this.ui.loadingFolders.hide();
	        }
	    },
	
	    itemViewOptions : {
	        isExisting : true
	    }
	
	});

/***/ },
/* 357 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var AddMoviesCollection = __webpack_require__(358);
	var SearchResultCollectionView = __webpack_require__(359);
	var EmptyView = __webpack_require__(361);
	var NotFoundView = __webpack_require__(362);
	var ErrorView = __webpack_require__(363);
	var LoadingView = __webpack_require__(117);
	
	module.exports = Marionette.Layout.extend({
	    template : 'AddMovies/AddMoviesViewTemplate',
	
	    regions : {
	        searchResult : '#search-result'
	    },
	
	    ui : {
	        moviesSearch : '.x-movies-search',
	        searchBar    : '.x-search-bar',
	        loadMore     : '.x-load-more'
	    },
	
	    events : {
	        'click .x-load-more' : '_onLoadMore'
	    },
	
	    initialize : function(options) {
	        console.log(options);
	        this.isExisting = options.isExisting;
	        this.collection = new AddMoviesCollection();
	
	        if (this.isExisting) {
	            this.collection.unmappedFolderModel = this.model;
	        }
	
	        if (this.isExisting) {
	            this.className = 'existing-movies';
	        } else {
	            this.className = 'new-movies';
	        }
	
	        this.listenTo(vent, vent.Events.MoviesAdded, this._onMoviesAdded);
	        this.listenTo(this.collection, 'sync', this._showResults);
	
	        this.resultCollectionView = new SearchResultCollectionView({
	            collection : this.collection,
	            isExisting : this.isExisting
	        });
	
	        this.throttledSearch = _.debounce(this.search, 1000, { trailing : true }).bind(this);
	    },
	
	    onRender : function() {
	        var self = this;
	
	        this.$el.addClass(this.className);
	
	        this.ui.moviesSearch.keyup(function(e) {
	
	            if (_.contains([
	                    9,
	                    16,
	                    17,
	                    18,
	                    19,
	                    20,
	                    33,
	                    34,
	                    35,
	                    36,
	                    37,
	                    38,
	                    39,
	                    40,
	                    91,
	                    92,
	                    93
	                ], e.keyCode)) {
	                return;
	            }
	
	            self._abortExistingSearch();
	            self.throttledSearch({
	                term : self.ui.moviesSearch.val()
	            });
	        });
	
	        this._clearResults();
	
	        if (this.isExisting) {
	            this.ui.searchBar.hide();
	        }
	    },
	
	    onShow : function() {
	        this.ui.moviesSearch.focus();
	    },
	
	    search : function(options) {
	        var self = this;
	
	        this.collection.reset();
	
	        if (!options.term || options.term === this.collection.term) {
	            return Marionette.$.Deferred().resolve();
	        }
	
	        this.searchResult.show(new LoadingView());
	        this.collection.term = options.term;
	        this.currentSearchPromise = this.collection.fetch({
	            data : { term : options.term }
	        });
	
	        this.currentSearchPromise.fail(function() {
	            self._showError();
	        });
	
	        return this.currentSearchPromise;
	    },
	
	    _onMoviesAdded : function(options) {
	        if (this.isExisting && options.movie.get('path') === this.model.get('folder').path) {
	            this.close();
	        }
	
	        else if (!this.isExisting) {
	            this.resultCollectionView.setExisting(options.movie.get('tmdbId'));
	            /*this.collection.term = '';
	            this.collection.reset();
	            this._clearResults();
	            this.ui.moviesSearch.val('');
	            this.ui.moviesSearch.focus();*/ //TODO: Maybe add option wheter to clear search result.
	        }
	    },
	
	    _onLoadMore : function() {
	        var showingAll = this.resultCollectionView.showMore();
	        this.ui.searchBar.show();
	
	        if (showingAll) {
	            this.ui.loadMore.hide();
	        }
	    },
	
	    _clearResults : function() {
	
	        if (!this.isExisting) {
	            this.searchResult.show(new EmptyView());
	        } else {
	            this.searchResult.close();
	        }
	    },
	
	    _showResults : function() {
	        if (!this.isClosed) {
	            if (this.collection.length === 0) {
	                this.ui.searchBar.show();
	                this.searchResult.show(new NotFoundView({ term : this.collection.term }));
	            } else {
	                this.searchResult.show(this.resultCollectionView);
	                if (!this.showingAll && this.isExisting) {
	                    this.ui.loadMore.show();
	                }
	            }
	        }
	    },
	
	    _abortExistingSearch : function() {
	        if (this.currentSearchPromise && this.currentSearchPromise.readyState > 0 && this.currentSearchPromise.readyState < 4) {
	            console.log('aborting previous pending search request.');
	            this.currentSearchPromise.abort();
	        } else {
	            this._clearResults();
	        }
	    },
	
	    _showError : function() {
	        if (!this.isClosed) {
	            this.ui.searchBar.show();
	            this.searchResult.show(new ErrorView({ term : this.collection.term }));
	            this.collection.term = '';
	        }
	    }
	});


/***/ },
/* 358 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var MovieModel = __webpack_require__(33);
	var _ = __webpack_require__(8);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/movies/lookup',
	    model : MovieModel,
	
	    parse : function(response) {
	        var self = this;
	
	        _.each(response, function(model) {
	            model.id = undefined;
	
	            if (self.unmappedFolderModel) {
	                model.path = self.unmappedFolderModel.get('folder').path;
	            }
	        });
	
	        return response;
	    }
	});


/***/ },
/* 359 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var SearchResultView = __webpack_require__(360);
	
	module.exports = Marionette.CollectionView.extend({
	    itemView : SearchResultView,
	
	    initialize : function(options) {
	        this.isExisting = options.isExisting;
	        this.showing = 1;
	    },
	
	    showAll : function() {
	        this.showingAll = true;
	        this.render();
	    },
	
	    showMore : function() {
	        this.showing += 5;
	        this.render();
	
	        return this.showing >= this.collection.length;
	    },
	
	    setExisting : function(tmdbid) {
	        var movies = this.collection.where({ tmdbId : tmdbid });
	        console.warn(movies);
	        //debugger;
	        if (movies.length > 0) {
	            this.children.findByModel(movies[0])._configureTemplateHelpers();
	            //this.children.findByModel(movies[0])._configureTemplateHelpers();
	            this.children.findByModel(movies[0]).render();
	            //this.templateHelpers.existing = existingMovies[0].toJSON();
	        }
	    },
	
	    appendHtml : function(collectionView, itemView, index) {
	        if (!this.isExisting || index < this.showing || index === 0) {
	            collectionView.$el.append(itemView.el);
	        }
	    }
	});


/***/ },
/* 360 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var Profiles = __webpack_require__(44);
	var RootFolders = __webpack_require__(354);
	var RootFolderLayout = __webpack_require__(351);
	var MoviesCollection = __webpack_require__(64);
	var Config = __webpack_require__(35);
	var Messenger = __webpack_require__(55);
	var AsValidatedView = __webpack_require__(220);
	
	__webpack_require__(344);
	
	var view = Marionette.ItemView.extend({
	
	    template : 'AddMovies/SearchResultViewTemplate',
	
	    ui : {
	        profile         : '.x-profile',
	        rootFolder      : '.x-root-folder',
	        seasonFolder    : '.x-season-folder',
	        monitor         : '.x-monitor',
	        monitorTooltip  : '.x-monitor-tooltip',
	        addButton       : '.x-add',
	        addSearchButton : '.x-add-search',
	        overview        : '.x-overview'
	    },
	
	    events : {
	        'click .x-add'            : '_addWithoutSearch',
	        'click .x-add-search'     : '_addAndSearch',
	        'change .x-profile'       : '_profileChanged',
	        'change .x-root-folder'   : '_rootFolderChanged',
	        'change .x-season-folder' : '_seasonFolderChanged',
	        'change .x-monitor'       : '_monitorChanged'
	    },
	
	    initialize : function() {
	
	        if (!this.model) {
	            throw 'model is required';
	        }
	
	        console.log(this.route);
	
	        this.templateHelpers = {};
	        this._configureTemplateHelpers();
	
	        this.listenTo(vent, Config.Events.ConfigUpdatedEvent, this._onConfigUpdated);
	        this.listenTo(this.model, 'change', this.render);
	        this.listenTo(RootFolders, 'all', this._rootFoldersUpdated);
	    },
	
	    onRender : function() {
	
	        var defaultProfile = Config.getValue(Config.Keys.DefaultProfileId);
	        var defaultRoot = Config.getValue(Config.Keys.DefaultRootFolderId);
	        var useSeasonFolder = Config.getValueBoolean(Config.Keys.UseSeasonFolder, true);
	        var defaultMonitorEpisodes = Config.getValue(Config.Keys.MonitorEpisodes, 'missing');
	
	        if (Profiles.get(defaultProfile)) {
	            this.ui.profile.val(defaultProfile);
	        }
	
	        if (RootFolders.get(defaultRoot)) {
	            this.ui.rootFolder.val(defaultRoot);
	        }
	
	        this.ui.seasonFolder.prop('checked', useSeasonFolder);
	        this.ui.monitor.val(defaultMonitorEpisodes);
	
	        //TODO: make this work via onRender, FM?
	        //works with onShow, but stops working after the first render
	        this.ui.overview.dotdotdot({
	            height : 120
	        });
	
	        this.templateFunction = Marionette.TemplateCache.get('AddMovies/MonitoringTooltipTemplate');
	        var content = this.templateFunction();
	
	        this.ui.monitorTooltip.popover({
	            content   : content,
	            html      : true,
	            trigger   : 'hover',
	            title     : 'Episode Monitoring Options',
	            placement : 'right',
	            container : this.$el
	        });
	    },
	
	    _configureTemplateHelpers : function() {
	        var existingMovies = MoviesCollection.where({ tmdbId : this.model.get('tmdbId') });
	        console.log(existingMovies);
	        if (existingMovies.length > 0) {
	            this.templateHelpers.existing = existingMovies[0].toJSON();
	        }
	
	        this.templateHelpers.profiles = Profiles.toJSON();
	        console.log(this.model);
	        console.log(this.templateHelpers.existing);
	        if (!this.model.get('isExisting')) {
	            this.templateHelpers.rootFolders = RootFolders.toJSON();
	        }
	    },
	
	    _onConfigUpdated : function(options) {
	        if (options.key === Config.Keys.DefaultProfileId) {
	            this.ui.profile.val(options.value);
	        }
	
	        else if (options.key === Config.Keys.DefaultRootFolderId) {
	            this.ui.rootFolder.val(options.value);
	        }
	
	        else if (options.key === Config.Keys.UseSeasonFolder) {
	            this.ui.seasonFolder.prop('checked', options.value);
	        }
	
	        else if (options.key === Config.Keys.MonitorEpisodes) {
	            this.ui.monitor.val(options.value);
	        }
	    },
	
	    _profileChanged : function() {
	        Config.setValue(Config.Keys.DefaultProfileId, this.ui.profile.val());
	    },
	
	    _seasonFolderChanged : function() {
	        Config.setValue(Config.Keys.UseSeasonFolder, this.ui.seasonFolder.prop('checked'));
	    },
	
	    _rootFolderChanged : function() {
	        var rootFolderValue = this.ui.rootFolder.val();
	        if (rootFolderValue === 'addNew') {
	            var rootFolderLayout = new RootFolderLayout();
	            this.listenToOnce(rootFolderLayout, 'folderSelected', this._setRootFolder);
	            AppLayout.modalRegion.show(rootFolderLayout);
	        } else {
	            Config.setValue(Config.Keys.DefaultRootFolderId, rootFolderValue);
	        }
	    },
	
	    _monitorChanged : function() {
	        Config.setValue(Config.Keys.MonitorEpisodes, this.ui.monitor.val());
	    },
	
	    _setRootFolder : function(options) {
	        vent.trigger(vent.Commands.CloseModalCommand);
	        this.ui.rootFolder.val(options.model.id);
	        this._rootFolderChanged();
	    },
	
	    _addWithoutSearch : function() {
	        this._addMovies(false);
	    },
	
	    _addAndSearch : function() {
	        this._addMovies(true);
	    },
	
	    _addMovies : function(searchForMovie) {
	        var addButton = this.ui.addButton;
	        var addSearchButton = this.ui.addSearchButton;
	
	        addButton.addClass('disabled');
	        addSearchButton.addClass('disabled');
	
	        var profile = this.ui.profile.val();
	        var rootFolderPath = this.ui.rootFolder.children(':selected').text();
	
	        var options = this._getAddMoviesOptions();
	        options.searchForMovie = searchForMovie;
	        console.warn(searchForMovie);
	
	        this.model.set({
	            profileId      : profile,
	            rootFolderPath : rootFolderPath,
	            addOptions     : options,
	            monitored      : true
	        }, { silent : true });
	
	        var self = this;
	        var promise = this.model.save();
	
	        console.log(this.model.save);
	        console.log(promise);
	
	        if (searchForMovie) {
	            this.ui.addSearchButton.spinForPromise(promise);
	        }
	
	        else {
	            this.ui.addButton.spinForPromise(promise);
	        }
	
	        promise.always(function() {
	            addButton.removeClass('disabled');
	            addSearchButton.removeClass('disabled');
	        });
	
	        promise.done(function() {
	            MoviesCollection.add(self.model);
	
	            self.close();
	
	            Messenger.show({
	                message        : 'Added: ' + self.model.get('title'),
	                actions        : {
	                    goToSeries : {
	                        label  : 'Go to Movie',
	                        action : function() {
	                            Backbone.history.navigate('/movies/' + self.model.get('titleSlug'), { trigger : true });
	                        }
	                    }
	                },
	                hideAfter      : 8,
	                hideOnNavigate : true
	            });
	
	            vent.trigger(vent.Events.MoviesAdded, { movie : self.model });
	        });
	    },
	
	    _rootFoldersUpdated : function() {
	        this._configureTemplateHelpers();
	        this.render();
	    },
	
	    _getAddMoviesOptions : function() {
	        var monitor = this.ui.monitor.val();
	
	        var options = {
	            ignoreEpisodesWithFiles    : false,
	            ignoreEpisodesWithoutFiles : false
	        };
	
	        if (monitor === 'all') {
	            return options;
	        }
	
	        else if (monitor === 'future') {
	            options.ignoreEpisodesWithFiles = true;
	            options.ignoreEpisodesWithoutFiles = true;
	        }
	
	        // else if (monitor === 'latest') {
	        //     this.model.setSeasonPass(lastSeason.seasonNumber);
	        // }
	
	        // else if (monitor === 'first') {
	        //     this.model.setSeasonPass(lastSeason.seasonNumber + 1);
	        //     this.model.setSeasonMonitored(firstSeason.seasonNumber);
	        // }
	
	        else if (monitor === 'missing') {
	            options.ignoreEpisodesWithFiles = true;
	        }
	
	        else if (monitor === 'existing') {
	            options.ignoreEpisodesWithoutFiles = true;
	        }
	
	        // else if (monitor === 'none') {
	        //     this.model.setSeasonPass(lastSeason.seasonNumber + 1);
	        // }
	
	        return options;
	    }
	});
	
	AsValidatedView.apply(view);
	
	module.exports = view;


/***/ },
/* 361 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'AddMovies/EmptyViewTemplate'
	});


/***/ },
/* 362 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'AddMovies/NotFoundViewTemplate',
	
	    initialize : function(options) {
	        this.options = options;
	    },
	
	    templateHelpers : function() {
	        return this.options;
	    }
	});


/***/ },
/* 363 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'AddMovies/ErrorViewTemplate',
	
	    initialize : function(options) {
	        this.options = options;
	    },
	
	    templateHelpers : function() {
	        return this.options;
	    }
	});


/***/ },
/* 364 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var UnmappedFolderModel = __webpack_require__(365);
	var _ = __webpack_require__(8);
	
	module.exports = Backbone.Collection.extend({
	    model : UnmappedFolderModel,
	
	    importItems : function(rootFolderModel) {
	
	        this.reset();
	        var rootFolder = rootFolderModel;
	
	        _.each(rootFolderModel.get('unmappedFolders'), function(folder) {
	            this.push(new UnmappedFolderModel({
	                rootFolder : rootFolder,
	                folder     : folder
	            }));
	        }, this);
	    }
	});

/***/ },
/* 365 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 366 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backbone = __webpack_require__(6);
	var Backgrid = __webpack_require__(80);
	var MissingLayout = __webpack_require__(367);
	var CutoffUnmetLayout = __webpack_require__(369);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Wanted/WantedLayoutTemplate',
	
	    regions : {
	        content : '#content'
	        //missing    : '#missing',
	        //cutoff     : '#cutoff'
	    },
	
	    ui : {
	        missingTab : '.x-missing-tab',
	        cutoffTab  : '.x-cutoff-tab'
	    },
	
	    events : {
	        'click .x-missing-tab' : '_showMissing',
	        'click .x-cutoff-tab'  : '_showCutoffUnmet'
	    },
	
	    initialize : function(options) {
	        if (options.action) {
	            this.action = options.action.toLowerCase();
	        }
	    },
	
	    onShow : function() {
	        switch (this.action) {
	            case 'cutoff':
	                this._showCutoffUnmet();
	                break;
	            default:
	                this._showMissing();
	        }
	    },
	
	    _navigate : function(route) {
	        Backbone.history.navigate(route, {
	            trigger : false,
	            replace : true
	        });
	    },
	
	    _showMissing : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.content.show(new MissingLayout());
	        this.ui.missingTab.tab('show');
	        this._navigate('/wanted/missing');
	    },
	
	    _showCutoffUnmet : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.content.show(new CutoffUnmetLayout());
	        this.ui.cutoffTab.tab('show');
	        this._navigate('/wanted/cutoff');
	    }
	});

/***/ },
/* 367 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var MissingCollection = __webpack_require__(368);
	var SelectAllCell = __webpack_require__(119);
	var SeriesTitleCell = __webpack_require__(180);
	var EpisodeNumberCell = __webpack_require__(124);
	var EpisodeTitleCell = __webpack_require__(167);
	var RelativeDateCell = __webpack_require__(127);
	var EpisodeStatusCell = __webpack_require__(126);
	var GridPager = __webpack_require__(193);
	var ToolbarLayout = __webpack_require__(105);
	var LoadingView = __webpack_require__(117);
	var Messenger = __webpack_require__(55);
	var CommandController = __webpack_require__(86);
	
	__webpack_require__(120);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Wanted/Missing/MissingLayoutTemplate',
	
	    regions : {
	        missing : '#x-missing',
	        toolbar : '#x-toolbar',
	        pager   : '#x-pager'
	    },
	
	    ui : {
	        searchSelectedButton : '.btn i.icon-sonarr-search'
	    },
	
	    columns : [
	        {
	            name       : '',
	            cell       : SelectAllCell,
	            headerCell : 'select-all',
	            sortable   : false
	        },
	        {
	            name      : 'series',
	            label     : 'Series Title',
	            cell      : SeriesTitleCell,
	            sortValue : 'series.sortTitle'
	        },
	        {
	            name     : 'this',
	            label    : 'Episode',
	            cell     : EpisodeNumberCell,
	            sortable : false
	        },
	        {
	            name     : 'this',
	            label    : 'Episode Title',
	            cell     : EpisodeTitleCell,
	            sortable : false
	        },
	        {
	            name  : 'airDateUtc',
	            label : 'Air Date',
	            cell  : RelativeDateCell
	        },
	        {
	            name     : 'status',
	            label    : 'Status',
	            cell     : EpisodeStatusCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function() {
	        this.collection = new MissingCollection().bindSignalR({ updateOnly : true });
	
	        this.listenTo(this.collection, 'sync', this._showTable);
	    },
	
	    onShow : function() {
	        this.missing.show(new LoadingView());
	        this._showToolbar();
	        this.collection.fetch();
	    },
	
	    _showTable : function() {
	        this.missingGrid = new Backgrid.Grid({
	            columns    : this.columns,
	            collection : this.collection,
	            className  : 'table table-hover'
	        });
	
	        this.missing.show(this.missingGrid);
	
	        this.pager.show(new GridPager({
	            columns    : this.columns,
	            collection : this.collection
	        }));
	    },
	
	    _showToolbar    : function() {
	        var leftSideButtons = {
	            type       : 'default',
	            storeState : false,
	            collapse   : true,
	            items      : [
	                {
	                    title        : 'Search Selected',
	                    icon         : 'icon-sonarr-search',
	                    callback     : this._searchSelected,
	                    ownerContext : this,
	                    className    : 'x-search-selected'
	                },
	                {
	                    title        : 'Search All Missing',
	                    icon         : 'icon-sonarr-search',
	                    callback     : this._searchMissing,
	                    ownerContext : this,
	                    className    : 'x-search-missing'
	                },
	                {
	                    title        : 'Toggle Selected',
	                    icon         : 'icon-sonarr-monitored',
	                    tooltip      : 'Toggle monitored status of selected',
	                    callback     : this._toggleMonitoredOfSelected,
	                    ownerContext : this,
	                    className    : 'x-unmonitor-selected'
	                },
	                {
	                    title : 'Season Pass',
	                    icon  : 'icon-sonarr-monitored',
	                    route : 'seasonpass'
	                },
	                {
	                    title      : 'Rescan Drone Factory Folder',
	                    icon       : 'icon-sonarr-refresh',
	                    command    : 'downloadedepisodesscan',
	                    properties : { sendUpdates : true }
	                },
	                {
	                    title        : 'Manual Import',
	                    icon         : 'icon-sonarr-search-manual',
	                    callback     : this._manualImport,
	                    ownerContext : this
	                }
	            ]
	        };
	        var filterOptions = {
	            type          : 'radio',
	            storeState    : false,
	            menuKey       : 'wanted.filterMode',
	            defaultAction : 'monitored',
	            items         : [
	                {
	                    key      : 'monitored',
	                    title    : '',
	                    tooltip  : 'Monitored Only',
	                    icon     : 'icon-sonarr-monitored',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'unmonitored',
	                    title    : '',
	                    tooltip  : 'Unmonitored Only',
	                    icon     : 'icon-sonarr-unmonitored',
	                    callback : this._setFilter
	                }
	            ]
	        };
	        this.toolbar.show(new ToolbarLayout({
	            left    : [leftSideButtons],
	            right   : [filterOptions],
	            context : this
	        }));
	        CommandController.bindToCommand({
	            element : this.$('.x-search-selected'),
	            command : { name : 'episodeSearch' }
	        });
	        CommandController.bindToCommand({
	            element : this.$('.x-search-missing'),
	            command : { name : 'missingEpisodeSearch' }
	        });
	    },
	
	    _setFilter      : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	        this.collection.state.currentPage = 1;
	        var promise = this.collection.setFilterMode(mode);
	        if (buttonContext) {
	            buttonContext.ui.icon.spinForPromise(promise);
	        }
	    },
	
	    _searchSelected : function() {
	        var selected = this.missingGrid.getSelectedModels();
	        if (selected.length === 0) {
	            Messenger.show({
	                type    : 'error',
	                message : 'No episodes selected'
	            });
	            return;
	        }
	        var ids = _.pluck(selected, 'id');
	        CommandController.Execute('episodeSearch', {
	            name       : 'episodeSearch',
	            episodeIds : ids
	        });
	    },
	    _searchMissing  : function() {
	        if (window.confirm('Are you sure you want to search for {0} missing episodes? '.format(this.collection.state.totalRecords) +
	                           'One API request to each indexer will be used for each episode. ' + 'This cannot be stopped once started.')) {
	            CommandController.Execute('missingEpisodeSearch', { name : 'missingEpisodeSearch' });
	        }
	    },
	    _toggleMonitoredOfSelected : function() {
	        var selected = this.missingGrid.getSelectedModels();
	
	        if (selected.length === 0) {
	            Messenger.show({
	                type    : 'error',
	                message : 'No episodes selected'
	            });
	            return;
	        }
	
	        var promises = [];
	        var self = this;
	
	        _.each(selected, function (episode) {
	            episode.set('monitored', !episode.get('monitored'));
	            promises.push(episode.save());
	        });
	
	        $.when(promises).done(function () {
	            self.collection.fetch();
	        });
	    },
	    _manualImport : function () {
	        vent.trigger(vent.Commands.ShowManualImport);
	    }
	});

/***/ },
/* 368 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var EpisodeModel = __webpack_require__(32);
	var PagableCollection = __webpack_require__(29);
	var AsFilteredCollection = __webpack_require__(65);
	var AsSortedCollection = __webpack_require__(34);
	var AsPersistedStateCollection = __webpack_require__(66);
	
	var Collection = PagableCollection.extend({
	    url       : window.NzbDrone.ApiRoot + '/wanted/missing',
	    model     : EpisodeModel,
	    tableName : 'wanted.missing',
	
	    state : {
	        pageSize : 15,
	        sortKey  : 'airDateUtc',
	        order    : 1
	    },
	
	    queryParams : {
	        totalPages   : null,
	        totalRecords : null,
	        pageSize     : 'pageSize',
	        sortKey      : 'sortKey',
	        order        : 'sortDir',
	        directions   : {
	            '-1' : 'asc',
	            '1'  : 'desc'
	        }
	    },
	
	    filterModes : {
	        'monitored'   : [
	            'monitored',
	            'true'
	        ],
	        'unmonitored' : [
	            'monitored',
	            'false'
	        ]
	    },
	
	    sortMappings : {
	        'series' : { sortKey : 'series.sortTitle' }
	    },
	
	    parseState : function(resp) {
	        return { totalRecords : resp.totalRecords };
	    },
	
	    parseRecords : function(resp) {
	        if (resp) {
	            return resp.records;
	        }
	
	        return resp;
	    }
	});
	Collection = AsFilteredCollection.call(Collection);
	Collection = AsSortedCollection.call(Collection);
	
	module.exports = AsPersistedStateCollection.call(Collection);

/***/ },
/* 369 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var CutoffUnmetCollection = __webpack_require__(370);
	var SelectAllCell = __webpack_require__(119);
	var SeriesTitleCell = __webpack_require__(180);
	var EpisodeNumberCell = __webpack_require__(124);
	var EpisodeTitleCell = __webpack_require__(167);
	var RelativeDateCell = __webpack_require__(127);
	var EpisodeStatusCell = __webpack_require__(126);
	var GridPager = __webpack_require__(193);
	var ToolbarLayout = __webpack_require__(105);
	var LoadingView = __webpack_require__(117);
	var Messenger = __webpack_require__(55);
	var CommandController = __webpack_require__(86);
	__webpack_require__(120);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Wanted/Cutoff/CutoffUnmetLayoutTemplate',
	
	    regions : {
	        cutoff  : '#x-cutoff-unmet',
	        toolbar : '#x-toolbar',
	        pager   : '#x-pager'
	    },
	
	    ui : {
	        searchSelectedButton : '.btn i.icon-sonarr-search'
	    },
	
	    columns : [
	        {
	            name       : '',
	            cell       : SelectAllCell,
	            headerCell : 'select-all',
	            sortable   : false
	        },
	        {
	            name      : 'series',
	            label     : 'Series Title',
	            cell      : SeriesTitleCell,
	            sortValue : 'series.sortTitle'
	        },
	        {
	            name     : 'this',
	            label    : 'Episode',
	            cell     : EpisodeNumberCell,
	            sortable : false
	        },
	        {
	            name     : 'this',
	            label    : 'Episode Title',
	            cell     : EpisodeTitleCell,
	            sortable : false
	        },
	        {
	            name  : 'airDateUtc',
	            label : 'Air Date',
	            cell  : RelativeDateCell
	        },
	        {
	            name     : 'status',
	            label    : 'Status',
	            cell     : EpisodeStatusCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function() {
	        this.collection = new CutoffUnmetCollection().bindSignalR({ updateOnly : true });
	
	        this.listenTo(this.collection, 'sync', this._showTable);
	    },
	
	    onShow : function() {
	        this.cutoff.show(new LoadingView());
	        this._showToolbar();
	        this.collection.fetch();
	    },
	
	    _showTable : function() {
	        this.cutoffGrid = new Backgrid.Grid({
	            columns    : this.columns,
	            collection : this.collection,
	            className  : 'table table-hover'
	        });
	
	        this.cutoff.show(this.cutoffGrid);
	
	        this.pager.show(new GridPager({
	            columns    : this.columns,
	            collection : this.collection
	        }));
	    },
	
	    _showToolbar : function() {
	        var leftSideButtons = {
	            type       : 'default',
	            storeState : false,
	            items      : [
	                {
	                    title        : 'Search Selected',
	                    icon         : 'icon-sonarr-search',
	                    callback     : this._searchSelected,
	                    ownerContext : this,
	                    className    : 'x-search-selected'
	                },
	                {
	                    title : 'Season Pass',
	                    icon  : 'icon-sonarr-monitored',
	                    route : 'seasonpass'
	                }
	            ]
	        };
	
	        var filterOptions = {
	            type          : 'radio',
	            storeState    : false,
	            menuKey       : 'wanted.filterMode',
	            defaultAction : 'monitored',
	            items         : [
	                {
	                    key      : 'monitored',
	                    title    : '',
	                    tooltip  : 'Monitored Only',
	                    icon     : 'icon-sonarr-monitored',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'unmonitored',
	                    title    : '',
	                    tooltip  : 'Unmonitored Only',
	                    icon     : 'icon-sonarr-unmonitored',
	                    callback : this._setFilter
	                }
	            ]
	        };
	
	        this.toolbar.show(new ToolbarLayout({
	            left    : [
	                leftSideButtons
	            ],
	            right   : [
	                filterOptions
	            ],
	            context : this
	        }));
	
	        CommandController.bindToCommand({
	            element : this.$('.x-search-selected'),
	            command : {
	                name : 'episodeSearch'
	            }
	        });
	    },
	
	    _setFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        this.collection.state.currentPage = 1;
	        var promise = this.collection.setFilterMode(mode);
	
	        if (buttonContext) {
	            buttonContext.ui.icon.spinForPromise(promise);
	        }
	    },
	
	    _searchSelected : function() {
	        var selected = this.cutoffGrid.getSelectedModels();
	
	        if (selected.length === 0) {
	            Messenger.show({
	                type    : 'error',
	                message : 'No episodes selected'
	            });
	
	            return;
	        }
	
	        var ids = _.pluck(selected, 'id');
	
	        CommandController.Execute('episodeSearch', {
	            name       : 'episodeSearch',
	            episodeIds : ids
	        });
	    }
	});

/***/ },
/* 370 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var EpisodeModel = __webpack_require__(32);
	var PagableCollection = __webpack_require__(29);
	var AsFilteredCollection = __webpack_require__(65);
	var AsSortedCollection = __webpack_require__(34);
	var AsPersistedStateCollection = __webpack_require__(66);
	
	var Collection = PagableCollection.extend({
	    url       : window.NzbDrone.ApiRoot + '/wanted/cutoff',
	    model     : EpisodeModel,
	    tableName : 'wanted.cutoff',
	
	    state : {
	        pageSize : 15,
	        sortKey  : 'airDateUtc',
	        order    : 1
	    },
	
	    queryParams : {
	        totalPages   : null,
	        totalRecords : null,
	        pageSize     : 'pageSize',
	        sortKey      : 'sortKey',
	        order        : 'sortDir',
	        directions   : {
	            '-1' : 'asc',
	            '1'  : 'desc'
	        }
	    },
	
	    // Filter Modes
	    filterModes : {
	        'monitored'   : [
	            'monitored',
	            'true'
	        ],
	        'unmonitored' : [
	            'monitored',
	            'false'
	        ],
	    },
	
	    sortMappings : {
	        'series' : { sortKey : 'series.sortTitle' }
	    },
	
	    parseState : function(resp) {
	        return { totalRecords : resp.totalRecords };
	    },
	
	    parseRecords : function(resp) {
	        if (resp) {
	            return resp.records;
	        }
	
	        return resp;
	    }
	});
	
	Collection = AsFilteredCollection.call(Collection);
	Collection = AsSortedCollection.call(Collection);
	
	module.exports = AsPersistedStateCollection.call(Collection);

/***/ },
/* 371 */
/***/ function(module, exports, __webpack_require__) {

	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var UpcomingCollectionView = __webpack_require__(372);
	var CalendarView = __webpack_require__(375);
	var CalendarFeedView = __webpack_require__(379);
	var ToolbarLayout = __webpack_require__(105);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Calendar/CalendarLayoutTemplate',
	
	    regions : {
	        upcoming : '#x-upcoming',
	        calendar : '#x-calendar',
	        toolbar  : '#x-toolbar'
	    },
	
	    onShow : function() {
	        this._showUpcoming();
	        this._showCalendar();
	        this._showToolbar();
	    },
	
	    _showUpcoming : function() {
	        this.upcomingView = new UpcomingCollectionView();
	        this.upcoming.show(this.upcomingView);
	    },
	
	    _showCalendar : function() {
	        this.calendarView = new CalendarView();
	        this.calendar.show(this.calendarView);
	    },
	
	    _showiCal : function() {
	        var view = new CalendarFeedView();
	        AppLayout.modalRegion.show(view);
	    },
	
	    _showToolbar    : function() {
	        var leftSideButtons = {
	            type       : 'default',
	            storeState : false,
	            items      : [
	                {
	                    title        : 'Get iCal Link',
	                    icon         : 'icon-sonarr-calendar-o',
	                    callback     : this._showiCal,
	                    ownerContext : this
	                }
	            ]
	        };
	
	        var filterOptions = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'calendar.show',
	            defaultAction : 'monitored',
	            items         : [
	                {
	                    key      : 'all',
	                    title    : '',
	                    tooltip  : 'All',
	                    icon     : 'icon-sonarr-all',
	                    callback : this._setCalendarFilter
	                },
	                {
	                    key      : 'monitored',
	                    title    : '',
	                    tooltip  : 'Monitored Only',
	                    icon     : 'icon-sonarr-monitored',
	                    callback : this._setCalendarFilter
	                }
	            ]
	        };
	
	        this.toolbar.show(new ToolbarLayout({
	            left          : [leftSideButtons],
	            right         : [filterOptions],
	            context       : this,
	            floatOnMobile : true
	        }));
	    },
	
	    _setCalendarFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        if (mode === 'all') {
	            this.calendarView.setShowUnmonitored(true);
	            this.upcomingView.setShowUnmonitored(true);
	        }
	
	        else {
	            this.calendarView.setShowUnmonitored(false);
	            this.upcomingView.setShowUnmonitored(false);
	        }
	    }
	});

/***/ },
/* 372 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var UpcomingCollection = __webpack_require__(373);
	var UpcomingItemView = __webpack_require__(374);
	var Config = __webpack_require__(35);
	__webpack_require__(39);
	
	module.exports = Marionette.CollectionView.extend({
	    itemView : UpcomingItemView,
	
	    initialize : function() {
	        this.showUnmonitored = Config.getValue('calendar.show', 'monitored') === 'all';
	        this.collection = new UpcomingCollection().bindSignalR({ updateOnly : true });
	        this._fetchCollection();
	
	        this._fetchCollection = _.bind(this._fetchCollection, this);
	        this.timer = window.setInterval(this._fetchCollection, 60 * 60 * 1000);
	    },
	
	    onClose : function() {
	        window.clearInterval(this.timer);
	    },
	
	    setShowUnmonitored : function (showUnmonitored) {
	        if (this.showUnmonitored !== showUnmonitored) {
	            this.showUnmonitored = showUnmonitored;
	            this._fetchCollection();
	        }
	    },
	
	    _fetchCollection : function() {
	        this.collection.fetch({ data: { unmonitored : this.showUnmonitored }});
	    }
	});

/***/ },
/* 373 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var moment = __webpack_require__(17);
	var EpisodeModel = __webpack_require__(32);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/calendar',
	    model : EpisodeModel,
	
	    comparator : function(model1, model2) {
	        var airDate1 = model1.get('airDateUtc');
	        var date1 = moment(airDate1);
	        var time1 = date1.unix();
	
	        var airDate2 = model2.get('airDateUtc');
	        var date2 = moment(airDate2);
	        var time2 = date2.unix();
	
	        if (time1 < time2) {
	            return -1;
	        }
	
	        if (time1 > time2) {
	            return 1;
	        }
	
	        return 0;
	    }
	});

/***/ },
/* 374 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var moment = __webpack_require__(17);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Calendar/UpcomingItemViewTemplate',
	    tagName  : 'div',
	
	    events : {
	        'click .x-episode-title' : '_showEpisodeDetails'
	    },
	
	    initialize : function() {
	        var start = this.model.get('airDateUtc');
	        var runtime = this.model.get('series').runtime;
	        var end = moment(start).add('minutes', runtime);
	
	        this.model.set({
	            end : end.toISOString()
	        });
	
	        this.listenTo(this.model, 'change', this.render);
	    },
	
	    _showEpisodeDetails : function() {
	        vent.trigger(vent.Commands.ShowEpisodeDetails, { episode : this.model });
	    }
	});

/***/ },
/* 375 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var moment = __webpack_require__(17);
	var CalendarCollection = __webpack_require__(376);
	var UiSettings = __webpack_require__(22);
	var QueueCollection = __webpack_require__(28);
	var Config = __webpack_require__(35);
	
	__webpack_require__(39);
	__webpack_require__(377);
	__webpack_require__(378);
	
	module.exports = Marionette.ItemView.extend({
	    storageKey : 'calendar.view',
	
	    initialize : function() {
	        this.showUnmonitored = Config.getValue('calendar.show', 'monitored') === 'all';
	        this.collection = new CalendarCollection().bindSignalR({ updateOnly : true });
	        this.listenTo(this.collection, 'change', this._reloadCalendarEvents);
	        this.listenTo(QueueCollection, 'sync', this._reloadCalendarEvents);
	    },
	
	    render : function() {
	        this.$el.empty().fullCalendar(this._getOptions());
	    },
	
	    onShow : function() {
	        this.$('.fc-today-button').click();
	    },
	
	    setShowUnmonitored : function (showUnmonitored) {
	        if (this.showUnmonitored !== showUnmonitored) {
	            this.showUnmonitored = showUnmonitored;
	            this._getEvents(this.$el.fullCalendar('getView'));
	        }
	    },
	
	    _viewRender : function(view, element) {
	        if (Config.getValue(this.storageKey) !== view.name) {
	            Config.setValue(this.storageKey, view.name);
	        }
	
	        this._getEvents(view);
	        element.find('.fc-day-grid-container').css('height', '');
	    },
	
	    _eventRender : function(event, element) {
	        element.addClass(event.statusLevel);
	        element.children('.fc-content').addClass(event.statusLevel);
	
	        if (event.downloading) {
	            var progress = 100 - event.downloading.get('sizeleft') / event.downloading.get('size') * 100;
	            var releaseTitle = event.downloading.get('title');
	            var estimatedCompletionTime = moment(event.downloading.get('estimatedCompletionTime')).fromNow();
	            var status = event.downloading.get('status').toLocaleLowerCase();
	            var errorMessage = event.downloading.get('errorMessage');
	
	            if (status === 'pending') {
	                this._addStatusIcon(element, 'icon-sonarr-pending', 'Release will be processed {0}'.format(estimatedCompletionTime));
	            }
	
	            else if (errorMessage) {
	                if (status === 'completed') {
	                    this._addStatusIcon(element, 'icon-sonarr-import-failed', 'Import failed: {0}'.format(errorMessage));
	                } else {
	                    this._addStatusIcon(element, 'icon-sonarr-download-failed', 'Download failed: {0}'.format(errorMessage));
	                }
	            }
	
	            else if (status === 'failed') {
	                this._addStatusIcon(element, 'icon-sonarr-download-failed', 'Download failed: check download client for more details');
	            }
	
	            else if (status === 'warning') {
	                this._addStatusIcon(element, 'icon-sonarr-download-warning', 'Download warning: check download client for more details');
	            }
	
	            else {
	                element.find('.fc-time').after('<span class="chart pull-right" data-percent="{0}"></span>'.format(progress));
	
	                element.find('.chart').easyPieChart({
	                    barColor   : '#ffffff',
	                    trackColor : false,
	                    scaleColor : false,
	                    lineWidth  : 2,
	                    size       : 14,
	                    animate    : false
	                });
	
	                element.find('.chart').tooltip({
	                    title     : 'Episode is downloading - {0}% {1}'.format(progress.toFixed(1), releaseTitle),
	                    container : '.fc'
	                });
	            }
	        }
	
	        else if (event.model.get('unverifiedSceneNumbering')) {
	            this._addStatusIcon(element, 'icon-sonarr-form-warning', 'Scene number hasn\'t been verified yet.');
	        }
	
	        else if (event.model.get('series').seriesType === 'anime' && event.model.get('seasonNumber') > 0 && !event.model.has('absoluteEpisodeNumber')) {
	            this._addStatusIcon(element, 'icon-sonarr-form-warning', 'Episode does not have an absolute episode number');
	        }
	    },
	
	    _eventAfterAllRender :  function () {
	        if ($(window).width() < 768) {
	            this.$('.fc-center').show();
	            this.$('.calendar-title').remove();
	
	            var title = this.$('.fc-center').html();
	            var titleDiv = '<div class="calendar-title">{0}</div>'.format(title);
	
	            this.$('.fc-toolbar').before(titleDiv);
	            this.$('.fc-center').hide();
	        }
	
	        this._clearScrollBar();
	    },
	
	    _windowResize :  function () {
	        this._clearScrollBar();
	    },
	
	    _getEvents : function(view) {
	        var start = moment(view.start.toISOString()).toISOString();
	        var end = moment(view.end.toISOString()).toISOString();
	
	        this.$el.fullCalendar('removeEvents');
	
	        this.collection.fetch({
	            data    : {
	                start       : start,
	                end         : end,
	                unmonitored : this.showUnmonitored
	            },
	            success : this._setEventData.bind(this)
	        });
	    },
	
	    _setEventData : function(collection) {
	        if (collection.length === 0) {
	            return;
	        }
	
	        var events = [];
	        var self = this;
	
	        collection.each(function(model) {
	            var seriesTitle = model.get('series').title;
	            var start = model.get('airDateUtc');
	            var runtime = model.get('series').runtime;
	            var end = moment(start).add('minutes', runtime).toISOString();
	
	            var event = {
	                title       : seriesTitle,
	                start       : moment(start),
	                end         : moment(end),
	                allDay      : false,
	                statusLevel : self._getStatusLevel(model, end),
	                downloading : QueueCollection.findEpisode(model.get('id')),
	                model       : model,
	                sortOrder   : (model.get('seasonNumber') === 0 ? 1000000 : model.get('seasonNumber') * 10000) + model.get('episodeNumber')
	            };
	
	            events.push(event);
	        });
	
	        this.$el.fullCalendar('addEventSource', events);
	    },
	
	    _getStatusLevel : function(element, endTime) {
	        var hasFile = element.get('hasFile');
	        var downloading = QueueCollection.findEpisode(element.get('id')) || element.get('grabbed');
	        var currentTime = moment();
	        var start = moment(element.get('airDateUtc'));
	        var end = moment(endTime);
	        var monitored = element.get('series').monitored && element.get('monitored');
	
	        var statusLevel = 'primary';
	
	        if (hasFile) {
	            statusLevel = 'success';
	        }
	
	        else if (downloading) {
	            statusLevel = 'purple';
	        }
	
	        else if (!monitored) {
	            statusLevel = 'unmonitored';
	        }
	
	        else if (currentTime.isAfter(start) && currentTime.isBefore(end)) {
	            statusLevel = 'warning';
	        }
	
	        else if (start.isBefore(currentTime) && !hasFile) {
	            statusLevel = 'danger';
	        }
	
	        else if (element.get('episodeNumber') === 1) {
	            statusLevel = 'premiere';
	        }
	
	        if (end.isBefore(currentTime.startOf('day'))) {
	            statusLevel += ' past';
	        }
	
	        return statusLevel;
	    },
	
	    _reloadCalendarEvents : function() {
	        this.$el.fullCalendar('removeEvents');
	        this._setEventData(this.collection);
	    },
	
	    _getOptions    : function() {
	        var options = {
	            allDayDefault       : false,
	            weekMode            : 'variable',
	            firstDay            : UiSettings.get('firstDayOfWeek'),
	            timeFormat          : 'h(:mm)t',
	            viewRender          : this._viewRender.bind(this),
	            eventRender         : this._eventRender.bind(this),
	            eventAfterAllRender : this._eventAfterAllRender.bind(this),
	            windowResize        : this._windowResize.bind(this),
	            eventClick          : function(event) {
	                vent.trigger(vent.Commands.ShowEpisodeDetails, { episode : event.model });
	            }
	        };
	
	        if ($(window).width() < 768) {
	            options.defaultView = Config.getValue(this.storageKey, 'basicDay');
	
	            options.header = {
	                left   : 'prev,next today',
	                center : 'title',
	                right  : 'basicWeek,basicDay'
	            };
	        }
	
	        else {
	            options.defaultView = Config.getValue(this.storageKey, 'basicWeek');
	
	            options.header = {
	                left   : 'prev,next today',
	                center : 'title',
	                right  : 'month,basicWeek,basicDay'
	            };
	        }
	
	        options.titleFormat = {
	            month : 'MMMM YYYY',
	            week  : UiSettings.get('shortDateFormat'),
	            day   : UiSettings.get('longDateFormat')
	        };
	
	        options.columnFormat = {
	            month : 'ddd',
	            week  : UiSettings.get('calendarWeekColumnHeader'),
	            day   : 'dddd'
	        };
	
	        options.timeFormat = UiSettings.get('timeFormat');
	
	        return options;
	    },
	
	    _addStatusIcon : function(element, icon, tooltip) {
	        element.find('.fc-time').after('<span class="status pull-right"><i class="{0}"></i></span>'.format(icon));
	        element.find('.status').tooltip({
	            title     : tooltip,
	            container : '.fc'
	        });
	    },
	
	    _clearScrollBar : function () {
	        // Remove height from calendar so we don't have another scroll bar
	        this.$('.fc-day-grid-container').css('height', '');
	        this.$('.fc-row.fc-widget-header').attr('style', '');
	    }
	});

/***/ },
/* 376 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var EpisodeModel = __webpack_require__(32);
	
	module.exports = Backbone.Collection.extend({
	    url       : window.NzbDrone.ApiRoot + '/calendar',
	    model     : EpisodeModel,
	    tableName : 'calendar',
	
	    comparator : function(model) {
	        var date = new Date(model.get('airDateUtc'));
	        var time = date.getTime();
	        return time;
	    }
	});

/***/ },
/* 377 */,
/* 378 */,
/* 379 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var StatusModel = __webpack_require__(25);
	__webpack_require__(329);
	__webpack_require__(258);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Calendar/CalendarFeedViewTemplate',
	
	    ui : {
	        includeUnmonitored : '.x-includeUnmonitored',
	        premiersOnly       : '.x-premiersOnly',
	        tags               : '.x-tags',
	        icalUrl            : '.x-ical-url',
	        icalCopy           : '.x-ical-copy',
	        icalWebCal         : '.x-ical-webcal'
	    },
	
	    events : {
	        'click .x-includeUnmonitored' : '_updateUrl',
	        'click .x-premiersOnly'       : '_updateUrl',
	        'itemAdded .x-tags'           : '_updateUrl',
	        'itemRemoved .x-tags'         : '_updateUrl'
	    },
	
	    onShow : function() {
	        this._updateUrl();
	        this.ui.icalCopy.copyToClipboard(this.ui.icalUrl);
	        this.ui.tags.tagInput({ allowNew: false });
	    },
	
	    _updateUrl : function() {
	        var icalUrl = window.location.host + StatusModel.get('urlBase') + '/feed/calendar/NzbDrone.ics?';
	
	        if (this.ui.includeUnmonitored.prop('checked')) {
	            icalUrl += 'unmonitored=true&';
	        }
	
	        if (this.ui.premiersOnly.prop('checked')) {
	            icalUrl += 'premiersOnly=true&';
	        }
	
	        if (this.ui.tags.val()) {
	            icalUrl += 'tags=' + this.ui.tags.val() + '&';
	        }
	
	        icalUrl += 'apikey=' + window.NzbDrone.ApiKey;
	
	        var icalHttpUrl = window.location.protocol + '//' + icalUrl;
	        var icalWebCalUrl = 'webcal://' + icalUrl;
	
	        this.ui.icalUrl.attr('value', icalHttpUrl);
	        this.ui.icalWebCal.attr('href', icalWebCalUrl);
	    }
	});

/***/ },
/* 380 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var ReleaseCollection = __webpack_require__(154);
	var IndexerCell = __webpack_require__(381);
	var EpisodeNumberCell = __webpack_require__(124);
	var FileSizeCell = __webpack_require__(147);
	var QualityCell = __webpack_require__(136);
	var ApprovalStatusCell = __webpack_require__(148);
	var LoadingView = __webpack_require__(117);
	var EditionCell = __webpack_require__(153);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Release/ReleaseLayoutTemplate',
	
	    regions : {
	        grid    : '#x-grid',
	        toolbar : '#x-toolbar'
	    },
	
	    columns : [
	        {
	          name      : 'edition',
	          label     : 'Edition',
	          sortable  : false,
	          cell      : EditionCell
	        },
	        {
	            name     : 'indexer',
	            label    : 'Indexer',
	            sortable : true,
	            cell     : IndexerCell
	        },
	        {
	            name     : 'title',
	            label    : 'Title',
	            sortable : true,
	            cell     : Backgrid.StringCell
	        },
	        /*{
	            name     : 'episodeNumbers',
	            episodes : 'episodeNumbers',
	            label    : 'season',
	            cell     : EpisodeNumberCell
	        },*/
	        {
	            name     : 'size',
	            label    : 'Size',
	            sortable : true,
	            cell     : FileSizeCell
	        },
	        {
	            name     : 'quality',
	            label    : 'Quality',
	            sortable : true,
	            cell     : QualityCell
	        },
	        {
	            name  : 'rejections',
	            label : '',
	            cell  : ApprovalStatusCell,
	            title : 'Release Rejected'
	        }
	    ],
	
	    initialize : function() {
	        this.collection = new ReleaseCollection();
	        this.listenTo(this.collection, 'sync', this._showTable);
	    },
	
	    onRender : function() {
	        this.grid.show(new LoadingView());
	        this.collection.fetch();
	    },
	
	    _showTable : function() {
	        if (!this.isClosed) {
	            this.grid.show(new Backgrid.Grid({
	                row        : Backgrid.Row,
	                columns    : this.columns,
	                collection : this.collection,
	                className  : 'table table-hover'
	            }));
	        }
	    }
	});


/***/ },
/* 381 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'indexer-cell',
	
	    render : function() {
	        var indexer = this.model.get(this.column.get('name'));
	        this.$el.html(indexer);
	        return this;
	    }
	});

/***/ },
/* 382 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var SystemInfoLayout = __webpack_require__(383);
	var LogsLayout = __webpack_require__(394);
	var UpdateLayout = __webpack_require__(411);
	var BackupLayout = __webpack_require__(417);
	var TaskLayout = __webpack_require__(423);
	var Messenger = __webpack_require__(55);
	var StatusModel = __webpack_require__(25);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/SystemLayoutTemplate',
	
	    regions : {
	        status  : '#status',
	        logs    : '#logs',
	        updates : '#updates',
	        backup  : '#backup',
	        tasks   : '#tasks'
	    },
	
	    ui : {
	        statusTab  : '.x-status-tab',
	        logsTab    : '.x-logs-tab',
	        updatesTab : '.x-updates-tab',
	        backupTab  : '.x-backup-tab',
	        tasksTab   : '.x-tasks-tab'
	    },
	
	    events : {
	        'click .x-status-tab'  : '_showStatus',
	        'click .x-logs-tab'    : '_showLogs',
	        'click .x-updates-tab' : '_showUpdates',
	        'click .x-backup-tab'  : '_showBackup',
	        'click .x-tasks-tab'   : '_showTasks',
	        'click .x-shutdown'    : '_shutdown',
	        'click .x-restart'     : '_restart'
	    },
	
	    initialize : function(options) {
	        if (options.action) {
	            this.action = options.action.toLowerCase();
	        }
	
	        this.templateHelpers = {
	            authentication : StatusModel.get('authentication')
	        };
	    },
	
	    onShow : function() {
	        switch (this.action) {
	            case 'logs':
	                this._showLogs();
	                break;
	            case 'updates':
	                this._showUpdates();
	                break;
	            case 'backup':
	                this._showBackup();
	                break;
	            case 'tasks':
	                this._showTasks();
	                break;
	            default:
	                this._showStatus();
	        }
	    },
	
	    _navigate : function(route) {
	        Backbone.history.navigate(route, {
	            trigger : true,
	            replace : true
	        });
	    },
	
	    _showStatus : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.status.show(new SystemInfoLayout());
	        this.ui.statusTab.tab('show');
	        this._navigate('system/status');
	    },
	
	    _showLogs : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.logs.show(new LogsLayout());
	        this.ui.logsTab.tab('show');
	        this._navigate('system/logs');
	    },
	
	    _showUpdates : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.updates.show(new UpdateLayout());
	        this.ui.updatesTab.tab('show');
	        this._navigate('system/updates');
	    },
	
	    _showBackup : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.backup.show(new BackupLayout());
	        this.ui.backupTab.tab('show');
	        this._navigate('system/backup');
	    },
	
	    _showTasks : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.tasks.show(new TaskLayout());
	        this.ui.tasksTab.tab('show');
	        this._navigate('system/tasks');
	    },
	
	    _shutdown : function() {
	        $.ajax({
	            url  : window.NzbDrone.ApiRoot + '/system/shutdown',
	            type : 'POST'
	        });
	
	        Messenger.show({
	            message : 'Sonarr will shutdown shortly',
	            type    : 'info'
	        });
	    },
	
	    _restart : function() {
	        $.ajax({
	            url  : window.NzbDrone.ApiRoot + '/system/restart',
	            type : 'POST'
	        });
	
	        Messenger.show({
	            message : 'Sonarr will restart shortly',
	            type    : 'info'
	        });
	    }
	});

/***/ },
/* 383 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var AboutView = __webpack_require__(384);
	var DiskSpaceLayout = __webpack_require__(385);
	var HealthLayout = __webpack_require__(389);
	var MoreInfoView = __webpack_require__(393);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Info/SystemInfoLayoutTemplate',
	
	    regions : {
	        about     : '#about',
	        diskSpace : '#diskspace',
	        health    : '#health',
	        moreInfo  : '#more-info'
	    },
	
	    onRender : function() {
	        this.health.show(new HealthLayout());
	        this.diskSpace.show(new DiskSpaceLayout());
	        this.about.show(new AboutView());
	        this.moreInfo.show(new MoreInfoView());
	    }
	});

/***/ },
/* 384 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var StatusModel = __webpack_require__(25);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'System/Info/About/AboutViewTemplate',
	
	    initialize : function() {
	        this.model = StatusModel;
	    }
	});

/***/ },
/* 385 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var DiskSpaceCollection = __webpack_require__(386);
	var LoadingView = __webpack_require__(117);
	var DiskSpacePathCell = __webpack_require__(388);
	var FileSizeCell = __webpack_require__(147);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Info/DiskSpace/DiskSpaceLayoutTemplate',
	
	    regions : {
	        grid : '#x-grid'
	    },
	
	    columns : [
	        {
	            name     : 'path',
	            label    : 'Location',
	            cell     : DiskSpacePathCell,
	            sortable : false
	        },
	        {
	            name     : 'freeSpace',
	            label    : 'Free Space',
	            cell     : FileSizeCell,
	            sortable : false
	        },
	        {
	            name     : 'totalSpace',
	            label    : 'Total Space',
	            cell     : FileSizeCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function() {
	        this.collection = new DiskSpaceCollection();
	        this.listenTo(this.collection, 'sync', this._showTable);
	    },
	
	    onRender : function() {
	        this.grid.show(new LoadingView());
	    },
	
	    onShow : function() {
	        this.collection.fetch();
	    },
	
	    _showTable : function() {
	        this.grid.show(new Backgrid.Grid({
	            row        : Backgrid.Row,
	            columns    : this.columns,
	            collection : this.collection,
	            className  : 'table table-hover'
	        }));
	    }
	});

/***/ },
/* 386 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var DiskSpaceModel = __webpack_require__(387);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/diskspace',
	    model : DiskSpaceModel
	});

/***/ },
/* 387 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 388 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'disk-space-path-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var path = this.model.get('path');
	        var label = this.model.get('label');
	
	        var contents = path;
	
	        if (label) {
	            contents += ' ({0})'.format(label);
	        }
	
	        this.$el.html(contents);
	
	        return this;
	    }
	});

/***/ },
/* 389 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var HealthCollection = __webpack_require__(60);
	var HealthCell = __webpack_require__(390);
	var HealthWikiCell = __webpack_require__(391);
	var HealthOkView = __webpack_require__(392);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Info/Health/HealthLayoutTemplate',
	
	    regions : {
	        grid : '#x-health-grid'
	    },
	
	    columns : [
	        {
	            name     : 'type',
	            label    : '',
	            cell     : HealthCell,
	            sortable : false
	        },
	        {
	            name     : 'message',
	            label    : 'Message',
	            cell     : 'string',
	            sortable : false
	        },
	        {
	            name     : 'wikiUrl',
	            label    : '',
	            cell     : HealthWikiCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function() {
	        this.listenTo(HealthCollection, 'sync', this.render);
	        HealthCollection.fetch();
	    },
	
	    onRender : function() {
	        if (HealthCollection.length === 0) {
	            this.grid.show(new HealthOkView());
	        } else {
	            this._showTable();
	        }
	    },
	
	    _showTable : function() {
	        this.grid.show(new Backgrid.Grid({
	            row        : Backgrid.Row,
	            columns    : this.columns,
	            collection : HealthCollection,
	            className  : 'table table-hover'
	        }));
	    }
	});

/***/ },
/* 390 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'log-level-cell',
	
	    render : function() {
	        var level = this._getValue();
	        this.$el.html('<i class="icon-sonarr-health-{0}" title="{1}"/>'.format(this._getValue().toLowerCase(), level));
	
	        return this;
	    }
	});

/***/ },
/* 391 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.UriCell.extend({
	    className : 'wiki-link-cell',
	
	    title : 'Read the Wiki for more information',
	
	    text : 'Wiki',
	
	    render : function() {
	        this.$el.empty();
	        var rawValue = this.model.get(this.column.get('name'));
	        var formattedValue = this.formatter.fromRaw(rawValue, this.model);
	        this.$el.append($('<a>', {
	            tabIndex : -1,
	            href     : rawValue,
	            title    : this.title || formattedValue,
	            target   : this.target
	        }).text(this.text));
	        this.delegateEvents();
	        return this;
	    }
	});

/***/ },
/* 392 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'System/Info/Health/HealthOkViewTemplate'
	});

/***/ },
/* 393 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'System/Info/MoreInfo/MoreInfoViewTemplate'
	});

/***/ },
/* 394 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var LogsTableLayout = __webpack_require__(395);
	var LogsFileLayout = __webpack_require__(401);
	var LogFileCollection = __webpack_require__(407);
	var UpdateLogFileCollection = __webpack_require__(409);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Logs/LogsLayoutTemplate',
	
	    ui : {
	        tableTab       : '.x-table-tab',
	        filesTab       : '.x-files-tab',
	        updateFilesTab : '.x-update-files-tab'
	    },
	
	    regions : {
	        table       : '#table',
	        files       : '#files',
	        updateFiles : '#update-files'
	    },
	
	    events : {
	        'click .x-table-tab'        : '_showTable',
	        'click .x-files-tab'        : '_showFiles',
	        'click .x-update-files-tab' : '_showUpdateFiles'
	    },
	
	    onShow : function() {
	        this._showTable();
	    },
	
	    _showTable : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.tableTab.tab('show');
	        this.table.show(new LogsTableLayout());
	    },
	
	    _showFiles : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.filesTab.tab('show');
	        this.files.show(new LogsFileLayout({
	            collection         : new LogFileCollection(),
	            deleteFilesCommand : 'deleteLogFiles'
	        }));
	    },
	
	    _showUpdateFiles : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.updateFilesTab.tab('show');
	        this.updateFiles.show(new LogsFileLayout({
	            collection         : new UpdateLogFileCollection(),
	            deleteFilesCommand : 'deleteUpdateLogFiles'
	        }));
	    }
	});

/***/ },
/* 395 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var LogTimeCell = __webpack_require__(396);
	var LogLevelCell = __webpack_require__(397);
	var LogRow = __webpack_require__(398);
	var GridPager = __webpack_require__(193);
	var LogCollection = __webpack_require__(399);
	var ToolbarLayout = __webpack_require__(105);
	var LoadingView = __webpack_require__(117);
	__webpack_require__(4);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Logs/Table/LogsTableLayoutTemplate',
	
	    regions : {
	        grid    : '#x-grid',
	        toolbar : '#x-toolbar',
	        pager   : '#x-pager'
	    },
	
	    attributes : {
	        id : 'logs-screen'
	    },
	
	    columns : [
	        {
	            name     : 'level',
	            label    : '',
	            sortable : true,
	            cell     : LogLevelCell
	        },
	        {
	            name     : 'logger',
	            label    : 'Component',
	            sortable : true,
	            cell     : Backgrid.StringCell.extend({
	                className : 'log-logger-cell'
	            })
	        },
	        {
	            name     : 'message',
	            label    : 'Message',
	            sortable : false,
	            cell     : Backgrid.StringCell.extend({
	                className : 'log-message-cell'
	            })
	        },
	        {
	            name  : 'time',
	            label : 'Time',
	            cell  : LogTimeCell
	        }
	    ],
	
	    initialize : function() {
	        this.collection = new LogCollection();
	
	        this.listenTo(this.collection, 'sync', this._showTable);
	        this.listenTo(vent, vent.Events.CommandComplete, this._commandComplete);
	    },
	
	    onRender : function() {
	        this.grid.show(new LoadingView());
	    },
	
	    onShow : function() {
	        this._showToolbar();
	    },
	
	    _showTable : function() {
	        this.grid.show(new Backgrid.Grid({
	            row        : LogRow,
	            columns    : this.columns,
	            collection : this.collection,
	            className  : 'table table-hover'
	        }));
	
	        this.pager.show(new GridPager({
	            columns    : this.columns,
	            collection : this.collection
	        }));
	    },
	
	    _showToolbar : function() {
	        var filterButtons = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'logs.filterMode',
	            defaultAction : 'all',
	            items         : [
	                {
	                    key      : 'all',
	                    title    : '',
	                    tooltip  : 'All',
	                    icon     : 'icon-sonarr-all',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'info',
	                    title    : '',
	                    tooltip  : 'Info',
	                    icon     : 'icon-sonarr-log-info',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'warn',
	                    title    : '',
	                    tooltip  : 'Warn',
	                    icon     : 'icon-sonarr-log-warn',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'error',
	                    title    : '',
	                    tooltip  : 'Error',
	                    icon     : 'icon-sonarr-log-error',
	                    callback : this._setFilter
	                }
	            ]
	        };
	
	        var leftSideButtons = {
	            type       : 'default',
	            storeState : false,
	            items      : [
	                {
	                    title        : 'Refresh',
	                    icon         : 'icon-sonarr-refresh',
	                    ownerContext : this,
	                    callback     : this._refreshTable
	                },
	                {
	                    title   : 'Clear Logs',
	                    icon    : 'icon-sonarr-clear',
	                    command : 'clearLog'
	                }
	            ]
	        };
	
	        this.toolbar.show(new ToolbarLayout({
	            left    : [leftSideButtons],
	            right   : [filterButtons],
	            context : this
	        }));
	    },
	
	    _refreshTable : function(buttonContext) {
	        this.collection.state.currentPage = 1;
	        var promise = this.collection.fetch({ reset : true });
	
	        if (buttonContext) {
	            buttonContext.ui.icon.spinForPromise(promise);
	        }
	    },
	
	    _setFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        this.collection.setFilterMode(mode, { reset : false });
	
	        this.collection.state.currentPage = 1;
	        var promise = this.collection.fetch({ reset : true });
	
	        if (buttonContext) {
	            buttonContext.ui.icon.spinForPromise(promise);
	        }
	    },
	
	    _commandComplete : function(options) {
	        if (options.command.get('name') === 'clearlog') {
	            this._refreshTable();
	        }
	    }
	});

/***/ },
/* 396 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var moment = __webpack_require__(17);
	var FormatHelpers = __webpack_require__(20);
	var UiSettings = __webpack_require__(22);
	
	module.exports = NzbDroneCell.extend({
	    className : 'log-time-cell',
	
	    render : function() {
	        var dateStr = this._getValue();
	        var date = moment(dateStr);
	        var diff = date.diff(moment().zone(date.zone()).startOf('day'), 'days', true);
	        var result = '<span title="{0}">{1}</span>';
	        var tooltip = date.format(UiSettings.longDateTime(true));
	        var text;
	
	        if (diff > 0 && diff < 1) {
	            text = date.format(UiSettings.time(true, false));
	        } else {
	            if (UiSettings.get('showRelativeDates')) {
	                text = FormatHelpers.relativeDate(dateStr);
	            } else {
	                text = date.format(UiSettings.get('shortDateFormat'));
	            }
	        }
	
	        this.$el.html(result.format(tooltip, text));
	
	        return this;
	    }
	});

/***/ },
/* 397 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'log-level-cell',
	
	    render : function() {
	        var level = this._getValue();
	        this.$el.html('<i class="icon-sonarr-log-{0}" title="{1}"/>'.format(this._getValue().toLowerCase(), level));
	
	        return this;
	    }
	});

/***/ },
/* 398 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Row.extend({
	    className : 'log-row',
	
	    events : {
	        'click' : '_showDetails'
	    },
	
	    _showDetails : function() {
	        vent.trigger(vent.Commands.ShowLogDetails, { model : this.model });
	    }
	});

/***/ },
/* 399 */
/***/ function(module, exports, __webpack_require__) {

	var PagableCollection = __webpack_require__(29);
	var LogsModel = __webpack_require__(400);
	var AsFilteredCollection = __webpack_require__(65);
	var AsPersistedStateCollection = __webpack_require__(66);
	
	var collection = PagableCollection.extend({
	    url       : window.NzbDrone.ApiRoot + '/log',
	    model     : LogsModel,
	    tableName : 'logs',
	
	    state : {
	        pageSize : 50,
	        sortKey  : 'time',
	        order    : 1
	    },
	
	    queryParams : {
	        totalPages   : null,
	        totalRecords : null,
	        pageSize     : 'pageSize',
	        sortKey      : 'sortKey',
	        order        : 'sortDir',
	        directions   : {
	            '-1' : 'asc',
	            '1'  : 'desc'
	        }
	    },
	
	    // Filter Modes
	    filterModes : {
	        "all"   : [
	            null,
	            null
	        ],
	        "info"  : [
	            'level',
	            'Info'
	        ],
	        "warn"  : [
	            'level',
	            'Warn'
	        ],
	        "error" : [
	            'level',
	            'Error'
	        ]
	    },
	
	    parseState : function(resp, queryParams, state) {
	        return { totalRecords : resp.totalRecords };
	    },
	
	    parseRecords : function(resp) {
	        if (resp) {
	            return resp.records;
	        }
	
	        return resp;
	    }
	});
	
	collection = AsFilteredCollection.apply(collection);
	
	module.exports = AsPersistedStateCollection.apply(collection);

/***/ },
/* 400 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 401 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var FilenameCell = __webpack_require__(402);
	var RelativeDateCell = __webpack_require__(127);
	var DownloadLogCell = __webpack_require__(403);
	var LogFileRow = __webpack_require__(404);
	var ContentsView = __webpack_require__(405);
	var ContentsModel = __webpack_require__(406);
	var ToolbarLayout = __webpack_require__(105);
	var LoadingView = __webpack_require__(117);
	__webpack_require__(4);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Logs/Files/LogFileLayoutTemplate',
	
	    regions : {
	        toolbar  : '#x-toolbar',
	        grid     : '#x-grid',
	        contents : '#x-contents'
	    },
	
	    columns : [
	        {
	            name     : 'filename',
	            label    : 'Filename',
	            cell     : FilenameCell,
	            sortable : false
	        },
	        {
	            name     : 'lastWriteTime',
	            label    : 'Last Write Time',
	            cell     : RelativeDateCell,
	            sortable : false
	        },
	        {
	            name     : 'downloadUrl',
	            label    : '',
	            cell     : DownloadLogCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function(options) {
	        this.collection = options.collection;
	        this.deleteFilesCommand = options.deleteFilesCommand;
	
	        this.listenTo(vent, vent.Commands.ShowLogFile, this._fetchLogFileContents);
	        this.listenTo(vent, vent.Events.CommandComplete, this._commandComplete);
	        this.listenTo(this.collection, 'sync', this._collectionSynced);
	
	        this.collection.fetch();
	    },
	
	    onShow : function() {
	        this._showToolbar();
	        this._showTable();
	    },
	
	    _showToolbar : function() {
	        var leftSideButtons = {
	            type       : 'default',
	            storeState : false,
	            items      : [
	                {
	                    title        : 'Refresh',
	                    icon         : 'icon-sonarr-refresh',
	                    ownerContext : this,
	                    callback     : this._refreshTable
	                },
	                {
	                    title          : 'Clear Log Files',
	                    icon           : 'icon-sonarr-clear',
	                    command        : this.deleteFilesCommand,
	                    successMessage : 'Log files have been deleted',
	                    errorMessage   : 'Failed to delete log files'
	                }
	            ]
	        };
	
	        this.toolbar.show(new ToolbarLayout({
	            left    : [leftSideButtons],
	            context : this
	        }));
	    },
	
	    _showTable : function() {
	        this.grid.show(new Backgrid.Grid({
	            row        : LogFileRow,
	            columns    : this.columns,
	            collection : this.collection,
	            className  : 'table table-hover'
	        }));
	    },
	
	    _collectionSynced : function() {
	        if (!this.collection.any()) {
	            return;
	        }
	
	        var model = this.collection.first();
	        this._fetchLogFileContents({ model : model });
	    },
	
	    _fetchLogFileContents : function(options) {
	        this.contents.show(new LoadingView());
	
	        var model = options.model;
	        var contentsModel = new ContentsModel(model.toJSON());
	
	        this.listenToOnce(contentsModel, 'sync', this._showDetails);
	
	        contentsModel.fetch({ dataType : 'text' });
	    },
	
	    _showDetails : function(model) {
	        this.contents.show(new ContentsView({ model : model }));
	    },
	
	    _refreshTable : function(buttonContext) {
	        this.contents.close();
	        var promise = this.collection.fetch();
	
	        //Would be nice to spin the icon on the refresh button
	        if (buttonContext) {
	            buttonContext.ui.icon.spinForPromise(promise);
	        }
	    },
	
	    _commandComplete : function(options) {
	        if (options.command.get('name') === this.deleteFilesCommand.toLowerCase()) {
	            this._refreshTable();
	        }
	    }
	});

/***/ },
/* 402 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'log-filename-cell',
	
	    render : function() {
	        var filename = this._getValue();
	        this.$el.html(filename);
	
	        return this;
	    }
	});

/***/ },
/* 403 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'download-log-cell',
	
	    render : function() {
	        this.$el.empty();
	        this.$el.html('<a href="{0}" class="no-router" target="_blank">Download</a>'.format(this.cellValue));
	
	        return this;
	    }
	});

/***/ },
/* 404 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Row.extend({
	    className : 'log-file-row',
	
	    events : {
	        'click' : '_showDetails'
	    },
	
	    _showDetails : function() {
	        vent.trigger(vent.Commands.ShowLogFile, { model : this.model });
	    }
	});

/***/ },
/* 405 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'System/Logs/Files/ContentsViewTemplate'
	});

/***/ },
/* 406 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({
	    url : function() {
	        return this.get('contentsUrl');
	    },
	
	    parse : function(contents) {
	        var response = {};
	        response.contents = contents;
	        return response;
	    }
	});

/***/ },
/* 407 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var LogFileModel = __webpack_require__(408);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/log/file',
	    model : LogFileModel,
	
	    state : {
	        sortKey : 'lastWriteTime',
	        order   : 1
	    }
	});

/***/ },
/* 408 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 409 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var LogFileModel = __webpack_require__(410);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/log/file/update',
	    model : LogFileModel,
	
	    state : {
	        sortKey : 'lastWriteTime',
	        order   : 1
	    }
	});

/***/ },
/* 410 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 411 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var UpdateCollection = __webpack_require__(412);
	var UpdateCollectionView = __webpack_require__(414);
	var LoadingView = __webpack_require__(117);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Update/UpdateLayoutTemplate',
	
	    regions : {
	        updates : '#x-updates'
	    },
	
	    initialize : function() {
	        this.updateCollection = new UpdateCollection();
	
	        this.listenTo(this.updateCollection, 'sync', this._showUpdates);
	    },
	
	    onRender : function() {
	        this.updates.show(new LoadingView());
	
	        this.updateCollection.fetch();
	    },
	
	    _showUpdates : function() {
	        this.updates.show(new UpdateCollectionView({ collection : this.updateCollection }));
	    }
	});

/***/ },
/* 412 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	var UpdateModel = __webpack_require__(413);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/update',
	    model : UpdateModel
	});

/***/ },
/* 413 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 414 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var UpdateItemView = __webpack_require__(415);
	var EmptyView = __webpack_require__(416);
	
	module.exports = Marionette.CollectionView.extend({
	    itemView  : UpdateItemView,
	    emptyView : EmptyView
	});

/***/ },
/* 415 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var CommandController = __webpack_require__(86);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'System/Update/UpdateItemViewTemplate',
	
	    events : {
	        'click .x-install-update' : '_installUpdate'
	    },
	
	    initialize : function() {
	        this.updating = false;
	    },
	
	    _installUpdate : function() {
	        if (this.updating) {
	            return;
	        }
	
	        this.updating = true;
	        var self = this;
	
	        var promise = CommandController.Execute('applicationUpdate');
	
	        promise.done(function() {
	            window.setTimeout(function() {
	                self.updating = false;
	            }, 5000);
	        });
	    }
	});

/***/ },
/* 416 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'System/Update/EmptyViewTemplate'
	});

/***/ },
/* 417 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var BackupCollection = __webpack_require__(418);
	var RelativeDateCell = __webpack_require__(127);
	var BackupFilenameCell = __webpack_require__(420);
	var BackupTypeCell = __webpack_require__(421);
	var EmptyView = __webpack_require__(422);
	var LoadingView = __webpack_require__(117);
	var ToolbarLayout = __webpack_require__(105);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Backup/BackupLayoutTemplate',
	
	    regions : {
	        backups : '#x-backups',
	        toolbar : '#x-backup-toolbar'
	    },
	
	    columns : [
	        {
	            name     : 'type',
	            label    : '',
	            sortable : false,
	            cell     : BackupTypeCell
	        },
	        {
	            name     : 'this',
	            label    : 'Name',
	            sortable : false,
	            cell     : BackupFilenameCell
	        },
	        {
	            name     : 'time',
	            label    : 'Time',
	            sortable : false,
	            cell     : RelativeDateCell
	        }
	    ],
	
	    leftSideButtons : {
	        type       : 'default',
	        storeState : false,
	        collapse   : false,
	        items      : [
	            {
	                title          : 'Backup',
	                icon           : 'icon-sonarr-file-text',
	                command        : 'backup',
	                properties     : { type : 'manual' },
	                successMessage : 'Database and settings were backed up successfully',
	                errorMessage   : 'Backup Failed!'
	            }
	        ]
	    },
	
	    initialize : function() {
	        this.backupCollection = new BackupCollection();
	
	        this.listenTo(this.backupCollection, 'sync', this._showBackups);
	        this.listenTo(vent, vent.Events.CommandComplete, this._commandComplete);
	    },
	
	    onRender : function() {
	        this._showToolbar();
	        this.backups.show(new LoadingView());
	
	        this.backupCollection.fetch();
	    },
	
	    _showBackups : function() {
	        if (this.backupCollection.length === 0) {
	            this.backups.show(new EmptyView());
	        } else {
	            this.backups.show(new Backgrid.Grid({
	                columns    : this.columns,
	                collection : this.backupCollection,
	                className  : 'table table-hover'
	            }));
	        }
	    },
	
	    _showToolbar     : function() {
	        this.toolbar.show(new ToolbarLayout({
	            left    : [this.leftSideButtons],
	            context : this
	        }));
	    },
	    _commandComplete : function(options) {
	        if (options.command.get('name') === 'backup') {
	            this.backupCollection.fetch();
	        }
	    }
	});

/***/ },
/* 418 */
/***/ function(module, exports, __webpack_require__) {

	var PageableCollection = __webpack_require__(29);
	var BackupModel = __webpack_require__(419);
	
	module.exports = PageableCollection.extend({
	    url   : window.NzbDrone.ApiRoot + '/system/backup',
	    model : BackupModel,
	
	    state : {
	        sortKey  : 'time',
	        order    : 1,
	        pageSize : 100000
	    },
	
	    mode : 'client'
	});

/***/ },
/* 419 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 420 */
/***/ function(module, exports, __webpack_require__) {

	var TemplatedCell = __webpack_require__(95);
	
	module.exports = TemplatedCell.extend({
	    className : 'series-title-cell',
	    template  : 'System/Backup/BackupFilenameCellTemplate'
	});

/***/ },
/* 421 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'backup-type-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var icon = 'icon-sonarr-backup-scheduled';
	        var title = 'Scheduled';
	
	        var type = this.model.get(this.column.get('name'));
	
	        if (type === 'manual') {
	            icon = 'icon-sonarr-backup-manual';
	            title = 'Manual';
	        } else if (type === 'update') {
	            icon = 'icon-sonarr-backup-update';
	            title = 'Before update';
	        }
	
	        this.$el.html('<i class="{0}" title="{1}"></i>'.format(icon, title));
	
	        return this;
	    }
	});

/***/ },
/* 422 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'System/Backup/BackupEmptyViewTemplate'
	});

/***/ },
/* 423 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var BackupCollection = __webpack_require__(424);
	var RelativeTimeCell = __webpack_require__(426);
	var TaskIntervalCell = __webpack_require__(427);
	var ExecuteTaskCell = __webpack_require__(428);
	var NextExecutionCell = __webpack_require__(429);
	var LoadingView = __webpack_require__(117);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    template : 'System/Task/TaskLayoutTemplate',
	
	    regions : {
	        tasks : '#x-tasks'
	    },
	
	    columns : [
	        {
	            name     : 'name',
	            label    : 'Name',
	            sortable : true,
	            cell     : 'string'
	        },
	        {
	            name     : 'interval',
	            label    : 'Interval',
	            sortable : true,
	            cell     : TaskIntervalCell
	        },
	        {
	            name     : 'lastExecution',
	            label    : 'Last Execution',
	            sortable : true,
	            cell     : RelativeTimeCell
	        },
	        {
	            name     : 'nextExecution',
	            label    : 'Next Execution',
	            sortable : true,
	            cell     : NextExecutionCell
	        },
	        {
	            name     : 'this',
	            label    : '',
	            sortable : false,
	            cell     : ExecuteTaskCell
	        }
	    ],
	
	    initialize : function() {
	        this.taskCollection = new BackupCollection();
	
	        this.listenTo(this.taskCollection, 'sync', this._showTasks);
	        this.taskCollection.bindSignalR();
	    },
	
	    onRender : function() {
	        this.tasks.show(new LoadingView());
	
	        this.taskCollection.fetch();
	    },
	
	    _showTasks : function() {
	        this.tasks.show(new Backgrid.Grid({
	            columns    : this.columns,
	            collection : this.taskCollection,
	            className  : 'table table-hover'
	        }));
	    }
	});

/***/ },
/* 424 */
/***/ function(module, exports, __webpack_require__) {

	var PageableCollection = __webpack_require__(29);
	var TaskModel = __webpack_require__(425);
	
	module.exports = PageableCollection.extend({
	    url   : window.NzbDrone.ApiRoot + '/system/task',
	    model : TaskModel,
	
	    state : {
	        sortKey  : 'name',
	        order    : -1,
	        pageSize : 100000
	    },
	
	    mode : 'client'
	});

/***/ },
/* 425 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 426 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var moment = __webpack_require__(17);
	var FormatHelpers = __webpack_require__(20);
	var UiSettings = __webpack_require__(22);
	
	module.exports = NzbDroneCell.extend({
	    className : 'relative-time-cell',
	
	    render : function() {
	
	        var dateStr = this.model.get(this.column.get('name'));
	
	        if (dateStr) {
	            var date = moment(dateStr);
	            var result = '<span title="{0}">{1}</span>';
	            var tooltip = date.format(UiSettings.longDateTime());
	            var text;
	
	            if (UiSettings.get('showRelativeDates')) {
	                text = date.fromNow();
	            } else {
	                text = date.format(UiSettings.shortDateTime());
	            }
	
	            this.$el.html(result.format(tooltip, text));
	        }
	
	        return this;
	    }
	});

/***/ },
/* 427 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var moment = __webpack_require__(17);
	
	module.exports = NzbDroneCell.extend({
	    className : 'task-interval-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var interval = this.model.get('interval');
	        var duration = moment.duration(interval, 'minutes').humanize().replace(/an?(?=\s)/, '1');
	
	        if (interval === 0) {
	            this.$el.html('disabled');
	        } else {
	            this.$el.html(duration);
	        }
	
	        return this;
	    }
	});

/***/ },
/* 428 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var CommandController = __webpack_require__(86);
	
	module.exports = NzbDroneCell.extend({
	    className : 'execute-task-cell',
	
	    events : {
	        'click .x-execute' : '_executeTask'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        var name = this.model.get('name');
	        var task = this.model.get('taskName');
	
	        this.$el.html('<i class="icon-sonarr-refresh icon-can-spin x-execute" title="Execute {0}"></i>'.format(name));
	
	        CommandController.bindToCommand({
	            element : this.$el.find('.x-execute'),
	            command : { name : task }
	        });
	
	        return this;
	    },
	
	    _executeTask : function() {
	        CommandController.Execute(this.model.get('taskName'), { name : this.model.get('taskName') });
	    }
	});

/***/ },
/* 429 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	var moment = __webpack_require__(17);
	var UiSettings = __webpack_require__(22);
	
	module.exports = NzbDroneCell.extend({
	    className : 'next-execution-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var interval = this.model.get('interval');
	        var nextExecution = moment(this.model.get('nextExecution'));
	
	        if (interval === 0) {
	            this.$el.html('-');
	        } else if (moment().isAfter(nextExecution)) {
	            this.$el.html('now');
	        } else {
	            var result = '<span title="{0}">{1}</span>';
	            var tooltip = nextExecution.format(UiSettings.longDateTime());
	            var text;
	
	            if (UiSettings.get('showRelativeDates')) {
	                text = nextExecution.fromNow();
	            } else {
	                text = nextExecution.format(UiSettings.shortDateTime());
	            }
	
	            this.$el.html(result.format(tooltip, text));
	        }
	
	        return this;
	    }
	});

/***/ },
/* 430 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Backgrid = __webpack_require__(80);
	var Marionette = __webpack_require__(11);
	var EmptyView = __webpack_require__(179);
	var SeriesCollection = __webpack_require__(123);
	var ToolbarLayout = __webpack_require__(105);
	var FooterView = __webpack_require__(431);
	var SelectAllCell = __webpack_require__(119);
	var SeriesStatusCell = __webpack_require__(183);
	var SeriesTitleCell = __webpack_require__(180);
	var SeriesMonitoredCell = __webpack_require__(166);
	var SeasonsCell = __webpack_require__(432);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    template : 'SeasonPass/SeasonPassLayoutTemplate',
	
	    regions : {
	        toolbar : '#x-toolbar',
	        series  : '#x-series'
	    },
	
	    columns : [
	        {
	            name       : '',
	            cell       : SelectAllCell,
	            headerCell : 'select-all',
	            sortable   : false
	        },
	        {
	            name  : 'statusWeight',
	            label : '',
	            cell  : SeriesStatusCell
	        },
	        {
	            name      : 'title',
	            label     : 'Title',
	            cell      : SeriesTitleCell,
	            cellValue : 'this'
	        },
	        {
	            name       : 'monitored',
	            label      : '',
	            cell       : SeriesMonitoredCell,
	            trueClass  : 'icon-sonarr-monitored',
	            falseClass : 'icon-sonarr-unmonitored',
	            tooltip    : 'Toggle series monitored status',
	            sortable   : false
	        },
	        {
	            name      : 'seasons',
	            label     : 'Seasons',
	            cell      : SeasonsCell,
	            cellValue : 'this'
	        }
	    ],
	
	    initialize : function() {
	        this.seriesCollection = SeriesCollection.clone();
	        this.seriesCollection.shadowCollection.bindSignalR();
	
	//        this.listenTo(this.seriesCollection, 'sync', this.render);
	        this.listenTo(this.seriesCollection, 'seasonpass:saved', this.render);
	
	        this.filteringOptions = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'seasonpass.filterMode',
	            defaultAction : 'all',
	            items         : [
	                {
	                    key      : 'all',
	                    title    : '',
	                    tooltip  : 'All',
	                    icon     : 'icon-sonarr-all',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'monitored',
	                    title    : '',
	                    tooltip  : 'Monitored Only',
	                    icon     : 'icon-sonarr-monitored',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'continuing',
	                    title    : '',
	                    tooltip  : 'Continuing Only',
	                    icon     : 'icon-sonarr-series-continuing',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'ended',
	                    title    : '',
	                    tooltip  : 'Ended Only',
	                    icon     : 'icon-sonarr-series-ended',
	                    callback : this._setFilter
	                }
	            ]
	        };
	    },
	
	    onRender : function() {
	        this._showTable();
	        this._showToolbar();
	        this._showFooter();
	    },
	
	    onClose : function() {
	        vent.trigger(vent.Commands.CloseControlPanelCommand);
	    },
	
	    _showToolbar : function() {
	        this.toolbar.show(new ToolbarLayout({
	            right   : [this.filteringOptions],
	            context : this
	        }));
	    },
	
	    _showTable : function() {
	        if (this.seriesCollection.shadowCollection.length === 0) {
	            this.series.show(new EmptyView());
	            this.toolbar.close();
	            return;
	        }
	
	        this.columns[0].sortedCollection = this.seriesCollection;
	
	        this.editorGrid = new Backgrid.Grid({
	            collection : this.seriesCollection,
	            columns    : this.columns,
	            className  : 'table table-hover'
	        });
	
	        this.series.show(this.editorGrid);
	        this._showFooter();
	    },
	
	    _showFooter : function() {
	        vent.trigger(vent.Commands.OpenControlPanelCommand, new FooterView({
	            editorGrid : this.editorGrid,
	            collection : this.seriesCollection
	        }));
	    },
	
	    _setFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        this.seriesCollection.setFilterMode(mode);
	    }
	});

/***/ },
/* 431 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var Marionette = __webpack_require__(11);
	var vent = __webpack_require__(36);
	var RootFolders = __webpack_require__(337);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'SeasonPass/SeasonPassFooterViewTemplate',
	
	    ui : {
	        seriesMonitored : '.x-series-monitored',
	        monitor         : '.x-monitor',
	        selectedCount   : '.x-selected-count',
	        container       : '.series-editor-footer',
	        actions         : '.x-action',
	        indicator       : '.x-indicator',
	        indicatorIcon   : '.x-indicator-icon'
	    },
	
	    events : {
	        'click .x-update' : '_update'
	    },
	
	    initialize : function(options) {
	        this.seriesCollection = options.collection;
	
	        RootFolders.fetch().done(function() {
	            RootFolders.synced = true;
	        });
	
	        this.editorGrid = options.editorGrid;
	        this.listenTo(this.seriesCollection, 'backgrid:selected', this._updateInfo);
	    },
	
	    onRender : function() {
	        this._updateInfo();
	    },
	
	    _update : function() {
	        var self = this;
	        var selected = this.editorGrid.getSelectedModels();
	        var seriesMonitored = this.ui.seriesMonitored.val();
	        var monitoringOptions;
	
	        _.each(selected, function(model) {
	            if (seriesMonitored === 'true') {
	                model.set('monitored', true);
	            } else if (seriesMonitored === 'false') {
	                model.set('monitored', false);
	            }
	
	            monitoringOptions = self._getMonitoringOptions(model);
	            model.set('addOptions', monitoringOptions);
	        });
	
	        var promise = $.ajax({
	            url  : window.NzbDrone.ApiRoot + '/seasonpass',
	            type : 'POST',
	            data : JSON.stringify({
	                series            : _.map(selected, function (model) {
	                    return model.toJSON();
	                }),
	                monitoringOptions : monitoringOptions
	            })
	        });
	
	        this.ui.indicator.show();
	
	        promise.always(function () {
	            self.ui.indicator.hide();
	        });
	
	        promise.done(function () {
	            self.seriesCollection.trigger('seasonpass:saved');
	        });
	    },
	
	    _updateInfo : function() {
	        var selected = this.editorGrid.getSelectedModels();
	        var selectedCount = selected.length;
	
	        this.ui.selectedCount.html('{0} series selected'.format(selectedCount));
	
	        if (selectedCount === 0) {
	            this.ui.actions.attr('disabled', 'disabled');
	        } else {
	            this.ui.actions.removeAttr('disabled');
	        }
	    },
	
	    _getMonitoringOptions : function(model) {
	        var monitor = this.ui.monitor.val();
	        var lastSeason = _.max(model.get('seasons'), 'seasonNumber');
	        var firstSeason = _.min(_.reject(model.get('seasons'), { seasonNumber : 0 }), 'seasonNumber');
	
	        if (monitor === 'noChange') {
	            return null;
	        }
	
	        model.setSeasonPass(firstSeason.seasonNumber);
	
	        var options = {
	            ignoreEpisodesWithFiles    : false,
	            ignoreEpisodesWithoutFiles : false
	        };
	
	        if (monitor === 'all') {
	            return options;
	        }
	
	        else if (monitor === 'future') {
	            options.ignoreEpisodesWithFiles = true;
	            options.ignoreEpisodesWithoutFiles = true;
	        }
	
	        else if (monitor === 'latest') {
	            model.setSeasonPass(lastSeason.seasonNumber);
	        }
	
	        else if (monitor === 'first') {
	            model.setSeasonPass(lastSeason.seasonNumber + 1);
	            model.setSeasonMonitored(firstSeason.seasonNumber);
	        }
	
	        else if (monitor === 'missing') {
	            options.ignoreEpisodesWithFiles = true;
	        }
	
	        else if (monitor === 'existing') {
	            options.ignoreEpisodesWithoutFiles = true;
	        }
	
	        else if (monitor === 'none') {
	            model.setSeasonPass(lastSeason.seasonNumber + 1);
	        }
	
	        return options;
	    }
	});

/***/ },
/* 432 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var TemplatedCell = __webpack_require__(95);
	//require('../Handlebars/Helpers/Numbers');
	
	module.exports = TemplatedCell.extend({
	    className : 'seasons-cell',
	    template  : 'SeasonPass/SeasonsCellTemplate',
	
	    events : {
	        'click .x-season-monitored' : '_toggleSeasonMonitored'
	    },
	
	    _toggleSeasonMonitored : function(e) {
	        var target = this.$(e.target).closest('.x-season-monitored');
	        var seasonNumber = parseInt(this.$(target).data('season-number'), 10);
	        var icon = this.$(target).children('.x-season-monitored-icon');
	
	        this.model.setSeasonMonitored(seasonNumber);
	
	        //TODO: unbounce the save so we don't multiple to the server at the same time
	        var savePromise = this.model.save();
	
	        icon.spinForPromise(savePromise);
	        savePromise.always(this.render.bind(this));
	    }
	});

/***/ },
/* 433 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var EmptyView = __webpack_require__(179);
	var SeriesCollection = __webpack_require__(123);
	var SeriesTitleCell = __webpack_require__(180);
	var ProfileCell = __webpack_require__(98);
	var SeriesStatusCell = __webpack_require__(183);
	var SeasonFolderCell = __webpack_require__(434);
	var SelectAllCell = __webpack_require__(119);
	var ToolbarLayout = __webpack_require__(105);
	var FooterView = __webpack_require__(435);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Series/Editor/SeriesEditorLayoutTemplate',
	
	    regions : {
	        seriesRegion : '#x-series-editor',
	        toolbar      : '#x-toolbar'
	    },
	
	    ui : {
	        monitored     : '.x-monitored',
	        profiles      : '.x-profiles',
	        rootFolder    : '.x-root-folder',
	        selectedCount : '.x-selected-count'
	    },
	
	    events : {
	        'click .x-save'         : '_updateAndSave',
	        'change .x-root-folder' : '_rootFolderChanged'
	    },
	
	    columns : [
	        {
	            name       : '',
	            cell       : SelectAllCell,
	            headerCell : 'select-all',
	            sortable   : false
	        },
	        {
	            name  : 'statusWeight',
	            label : '',
	            cell  : SeriesStatusCell
	        },
	        {
	            name      : 'title',
	            label     : 'Title',
	            cell      : SeriesTitleCell,
	            cellValue : 'this'
	        },
	        {
	            name  : 'profileId',
	            label : 'Profile',
	            cell  : ProfileCell
	        },
	        {
	            name  : 'seasonFolder',
	            label : 'Season Folder',
	            cell  : SeasonFolderCell
	        },
	        {
	            name  : 'path',
	            label : 'Path',
	            cell  : 'string'
	        }
	    ],
	
	    leftSideButtons : {
	        type       : 'default',
	        storeState : false,
	        items      : [
	            {
	                title : 'Season Pass',
	                icon  : 'icon-sonarr-monitored',
	                route : 'seasonpass'
	            },
	            {
	                title          : 'Update Library',
	                icon           : 'icon-sonarr-refresh',
	                command        : 'refreshseries',
	                successMessage : 'Library was updated!',
	                errorMessage   : 'Library update failed!'
	            }
	        ]
	    },
	
	    initialize : function() {
	        this.seriesCollection = SeriesCollection.clone();
	        this.seriesCollection.shadowCollection.bindSignalR();
	        this.listenTo(this.seriesCollection, 'save', this.render);
	
	        this.filteringOptions = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'serieseditor.filterMode',
	            defaultAction : 'all',
	            items         : [
	                {
	                    key      : 'all',
	                    title    : '',
	                    tooltip  : 'All',
	                    icon     : 'icon-sonarr-all',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'monitored',
	                    title    : '',
	                    tooltip  : 'Monitored Only',
	                    icon     : 'icon-sonarr-monitored',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'continuing',
	                    title    : '',
	                    tooltip  : 'Continuing Only',
	                    icon     : 'icon-sonarr-series-continuing',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'ended',
	                    title    : '',
	                    tooltip  : 'Ended Only',
	                    icon     : 'icon-sonarr-series-ended',
	                    callback : this._setFilter
	                }
	            ]
	        };
	    },
	
	    onRender : function() {
	        this._showToolbar();
	        this._showTable();
	    },
	
	    onClose : function() {
	        vent.trigger(vent.Commands.CloseControlPanelCommand);
	    },
	
	    _showTable : function() {
	        if (this.seriesCollection.shadowCollection.length === 0) {
	            this.seriesRegion.show(new EmptyView());
	            this.toolbar.close();
	            return;
	        }
	
	        this.columns[0].sortedCollection = this.seriesCollection;
	
	        this.editorGrid = new Backgrid.Grid({
	            collection : this.seriesCollection,
	            columns    : this.columns,
	            className  : 'table table-hover'
	        });
	
	        this.seriesRegion.show(this.editorGrid);
	        this._showFooter();
	    },
	
	    _showToolbar : function() {
	        this.toolbar.show(new ToolbarLayout({
	            left    : [
	                this.leftSideButtons
	            ],
	            right   : [
	                this.filteringOptions
	            ],
	            context : this
	        }));
	    },
	
	    _showFooter : function() {
	        vent.trigger(vent.Commands.OpenControlPanelCommand, new FooterView({
	            editorGrid : this.editorGrid,
	            collection : this.seriesCollection
	        }));
	    },
	
	    _setFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        this.seriesCollection.setFilterMode(mode);
	    }
	});

/***/ },
/* 434 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'season-folder-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var seasonFolder = this.model.get(this.column.get('name'));
	        this.$el.html(seasonFolder.toString());
	
	        return this;
	    }
	});

/***/ },
/* 435 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var vent = __webpack_require__(36);
	var Profiles = __webpack_require__(44);
	var RootFolders = __webpack_require__(337);
	var RootFolderLayout = __webpack_require__(334);
	var UpdateFilesSeriesView = __webpack_require__(436);
	var Config = __webpack_require__(35);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Series/Editor/SeriesEditorFooterViewTemplate',
	
	    ui : {
	        monitored           : '.x-monitored',
	        profile             : '.x-profiles',
	        seasonFolder        : '.x-season-folder',
	        rootFolder          : '.x-root-folder',
	        selectedCount       : '.x-selected-count',
	        container           : '.series-editor-footer',
	        actions             : '.x-action'
	    },
	
	    events : {
	        'click .x-save'           : '_updateAndSave',
	        'change .x-root-folder'   : '_rootFolderChanged',
	        'click .x-organize-files' : '_organizeFiles'
	    },
	
	    templateHelpers : function() {
	        return {
	            profiles    : Profiles,
	            rootFolders : RootFolders.toJSON()
	        };
	    },
	
	    initialize : function(options) {
	        this.seriesCollection = options.collection;
	
	        RootFolders.fetch().done(function() {
	            RootFolders.synced = true;
	        });
	
	        this.editorGrid = options.editorGrid;
	        this.listenTo(this.seriesCollection, 'backgrid:selected', this._updateInfo);
	        this.listenTo(RootFolders, 'all', this.render);
	    },
	
	    onRender : function() {
	        this._updateInfo();
	    },
	
	    _updateAndSave : function() {
	        var selected = this.editorGrid.getSelectedModels();
	
	        var monitored = this.ui.monitored.val();
	        var profile = this.ui.profile.val();
	        var seasonFolder = this.ui.seasonFolder.val();
	        var rootFolder = this.ui.rootFolder.val();
	
	        _.each(selected, function(model) {
	            if (monitored === 'true') {
	                model.set('monitored', true);
	            } else if (monitored === 'false') {
	                model.set('monitored', false);
	            }
	
	            if (profile !== 'noChange') {
	                model.set('profileId', parseInt(profile, 10));
	            }
	
	            if (seasonFolder === 'true') {
	                model.set('seasonFolder', true);
	            } else if (seasonFolder === 'false') {
	                model.set('seasonFolder', false);
	            }
	
	            if (rootFolder !== 'noChange') {
	                var rootFolderPath = RootFolders.get(parseInt(rootFolder, 10));
	
	                model.set('rootFolderPath', rootFolderPath.get('path'));
	            }
	
	            model.edited = true;
	        });
	
	        this.seriesCollection.save();
	    },
	
	    _updateInfo : function() {
	        var selected = this.editorGrid.getSelectedModels();
	        var selectedCount = selected.length;
	
	        this.ui.selectedCount.html('{0} series selected'.format(selectedCount));
	
	        if (selectedCount === 0) {
	            this.ui.actions.attr('disabled', 'disabled');
	        } else {
	            this.ui.actions.removeAttr('disabled');
	        }
	    },
	
	    _rootFolderChanged : function() {
	        var rootFolderValue = this.ui.rootFolder.val();
	        if (rootFolderValue === 'addNew') {
	            var rootFolderLayout = new RootFolderLayout();
	            this.listenToOnce(rootFolderLayout, 'folderSelected', this._setRootFolder);
	            vent.trigger(vent.Commands.OpenModalCommand, rootFolderLayout);
	        } else {
	            Config.setValue(Config.Keys.DefaultRootFolderId, rootFolderValue);
	        }
	    },
	
	    _setRootFolder : function(options) {
	        vent.trigger(vent.Commands.CloseModalCommand);
	        this.ui.rootFolder.val(options.model.id);
	        this._rootFolderChanged();
	    },
	
	    _organizeFiles : function() {
	        var selected = this.editorGrid.getSelectedModels();
	        var updateFilesSeriesView = new UpdateFilesSeriesView({ series : selected });
	        this.listenToOnce(updateFilesSeriesView, 'updatingFiles', this._afterSave);
	
	        vent.trigger(vent.Commands.OpenModalCommand, updateFilesSeriesView);
	    }
	});

/***/ },
/* 436 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var CommandController = __webpack_require__(86);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Series/Editor/Organize/OrganizeFilesViewTemplate',
	
	    events : {
	        'click .x-confirm-organize' : '_organize'
	    },
	
	    initialize : function(options) {
	        this.series = options.series;
	        this.templateHelpers = {
	            numberOfSeries : this.series.length,
	            series         : new Backbone.Collection(this.series).toJSON()
	        };
	    },
	
	    _organize : function() {
	        var seriesIds = _.pluck(this.series, 'id');
	
	        CommandController.Execute('renameSeries', {
	            name      : 'renameSeries',
	            seriesIds : seriesIds
	        });
	
	        this.trigger('organizingFiles');
	        vent.trigger(vent.Commands.CloseModalCommand);
	    }
	});

/***/ },
/* 437 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var EmptyView = __webpack_require__(93);
	var MoviesCollection = __webpack_require__(64);
	var MovieTitleCell = __webpack_require__(97);
	var ProfileCell = __webpack_require__(98);
	var SelectAllCell = __webpack_require__(119);
	var ToolbarLayout = __webpack_require__(105);
	var FooterView = __webpack_require__(438);
	__webpack_require__(39);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Movies/Editor/MovieEditorLayoutTemplate',
	
	    regions : {
	        seriesRegion : '#x-series-editor',
	        toolbar      : '#x-toolbar'
	    },
	
	    ui : {
	        monitored     : '.x-monitored',
	        profiles      : '.x-profiles',
	        rootFolder    : '.x-root-folder',
	        selectedCount : '.x-selected-count'
	    },
	
	    events : {
	        'click .x-save'         : '_updateAndSave',
	        'change .x-root-folder' : '_rootFolderChanged'
	    },
	
	    columns : [
	        {
	            name       : '',
	            cell       : SelectAllCell,
	            headerCell : 'select-all',
	            sortable   : false
	        },
	        {
	            name      : 'title',
	            label     : 'Title',
	            cell      : MovieTitleCell,
	            cellValue : 'this'
	        },
	        {
	            name  : 'profileId',
	            label : 'Profile',
	            cell  : ProfileCell
	        },
	        {
	            name  : 'path',
	            label : 'Path',
	            cell  : 'string'
	        }
	    ],
	
	    leftSideButtons : {
	        type       : 'default',
	        storeState : false,
	        items      : [
	            {
	                title          : 'Update Library',
	                icon           : 'icon-sonarr-refresh',
	                command        : 'refreshseries',
	                successMessage : 'Library was updated!',
	                errorMessage   : 'Library update failed!'
	            }
	        ]
	    },
	
	    initialize : function() {
	        this.movieCollection = MoviesCollection.clone();
	        this.movieCollection.shadowCollection.bindSignalR();
	        this.listenTo(this.movieCollection, 'save', this.render);
	
	        this.filteringOptions = {
	            type          : 'radio',
	            storeState    : true,
	            menuKey       : 'serieseditor.filterMode',
	            defaultAction : 'all',
	            items         : [
	                {
	                    key      : 'all',
	                    title    : '',
	                    tooltip  : 'All',
	                    icon     : 'icon-sonarr-all',
	                    callback : this._setFilter
	                },
	                {
	                    key      : 'monitored',
	                    title    : '',
	                    tooltip  : 'Monitored Only',
	                    icon     : 'icon-sonarr-monitored',
	                    callback : this._setFilter
	                }
	            ]
	        };
	    },
	
	    onRender : function() {
	        this._showToolbar();
	        this._showTable();
	    },
	
	    onClose : function() {
	        vent.trigger(vent.Commands.CloseControlPanelCommand);
	    },
	
	    _showTable : function() {
	        if (this.movieCollection.shadowCollection.length === 0) {
	            this.seriesRegion.show(new EmptyView());
	            this.toolbar.close();
	            return;
	        }
	
	        this.columns[0].sortedCollection = this.movieCollection;
	
	        this.editorGrid = new Backgrid.Grid({
	            collection : this.movieCollection,
	            columns    : this.columns,
	            className  : 'table table-hover'
	        });
	
	        this.seriesRegion.show(this.editorGrid);
	        this._showFooter();
	    },
	
	    _showToolbar : function() {
	        this.toolbar.show(new ToolbarLayout({
	            left    : [
	                this.leftSideButtons
	            ],
	            right   : [
	                this.filteringOptions
	            ],
	            context : this
	        }));
	    },
	
	    _showFooter : function() {
	        vent.trigger(vent.Commands.OpenControlPanelCommand, new FooterView({
	            editorGrid : this.editorGrid,
	            collection : this.movieCollection
	        }));
	    },
	
	    _setFilter : function(buttonContext) {
	        var mode = buttonContext.model.get('key');
	
	        this.movieCollection.setFilterMode(mode);
	    }
	});

/***/ },
/* 438 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	var vent = __webpack_require__(36);
	var Profiles = __webpack_require__(44);
	var RootFolders = __webpack_require__(354);
	var RootFolderLayout = __webpack_require__(351);
	var UpdateFilesMoviesView = __webpack_require__(439);
	var Config = __webpack_require__(35);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Movies/Editor/MovieEditorFooterViewTemplate',
	
	    ui : {
	        monitored           : '.x-monitored',
	        profile             : '.x-profiles',
	        seasonFolder        : '.x-season-folder',
	        rootFolder          : '.x-root-folder',
	        selectedCount       : '.x-selected-count',
	        container           : '.series-editor-footer',
	        actions             : '.x-action'
	    },
	
	    events : {
	        'click .x-save'           : '_updateAndSave',
	        'change .x-root-folder'   : '_rootFolderChanged',
	        'click .x-organize-files' : '_organizeFiles'
	    },
	
	    templateHelpers : function() {
	        return {
	            profiles    : Profiles,
	            rootFolders : RootFolders.toJSON()
	        };
	    },
	
	    initialize : function(options) {
	        this.moviesCollection = options.collection;
	
	        RootFolders.fetch().done(function() {
	            RootFolders.synced = true;
	        });
	
	        this.editorGrid = options.editorGrid;
	        this.listenTo(this.moviesCollection, 'backgrid:selected', this._updateInfo);
	        this.listenTo(RootFolders, 'all', this.render);
	    },
	
	    onRender : function() {
	        this._updateInfo();
	    },
	
	    _updateAndSave : function() {
	        var selected = this.editorGrid.getSelectedModels();
	
	        var monitored = this.ui.monitored.val();
	        var profile = this.ui.profile.val();
	        var seasonFolder = this.ui.seasonFolder.val();
	        var rootFolder = this.ui.rootFolder.val();
	
	        _.each(selected, function(model) {
	            if (monitored === 'true') {
	                model.set('monitored', true);
	            } else if (monitored === 'false') {
	                model.set('monitored', false);
	            }
	
	            if (profile !== 'noChange') {
	                model.set('profileId', parseInt(profile, 10));
	            }
	
	            if (seasonFolder === 'true') {
	                model.set('seasonFolder', true);
	            } else if (seasonFolder === 'false') {
	                model.set('seasonFolder', false);
	            }
	
	            if (rootFolder !== 'noChange') {
	                var rootFolderPath = RootFolders.get(parseInt(rootFolder, 10));
	
	                model.set('rootFolderPath', rootFolderPath.get('path'));
	            }
	
	            model.edited = true;
	        });
	
	        this.moviesCollection.save();
	    },
	
	    _updateInfo : function() {
	        var selected = this.editorGrid.getSelectedModels();
	        var selectedCount = selected.length;
	
	        this.ui.selectedCount.html('{0} movies selected'.format(selectedCount));
	
	        if (selectedCount === 0) {
	            this.ui.actions.attr('disabled', 'disabled');
	        } else {
	            this.ui.actions.removeAttr('disabled');
	        }
	    },
	
	    _rootFolderChanged : function() {
	        var rootFolderValue = this.ui.rootFolder.val();
	        if (rootFolderValue === 'addNew') {
	            var rootFolderLayout = new RootFolderLayout();
	            this.listenToOnce(rootFolderLayout, 'folderSelected', this._setRootFolder);
	            vent.trigger(vent.Commands.OpenModalCommand, rootFolderLayout);
	        } else {
	            Config.setValue(Config.Keys.DefaultRootFolderId, rootFolderValue);
	        }
	    },
	
	    _setRootFolder : function(options) {
	        vent.trigger(vent.Commands.CloseModalCommand);
	        this.ui.rootFolder.val(options.model.id);
	        this._rootFolderChanged();
	    },
	
	    _organizeFiles : function() {
	        var selected = this.editorGrid.getSelectedModels();
	        var updateFilesMoviesView = new UpdateFilesMoviesView({ movies : selected });
	        this.listenToOnce(updateFilesMoviesView, 'updatingFiles', this._afterSave);
	
	        vent.trigger(vent.Commands.OpenModalCommand, updateFilesMoviesView);
	    }
	});

/***/ },
/* 439 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Backbone = __webpack_require__(6);
	var Marionette = __webpack_require__(11);
	var CommandController = __webpack_require__(86);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Movies/Editor/Organize/OrganizeFilesViewTemplate',
	
	    events : {
	        'click .x-confirm-organize' : '_organize'
	    },
	
	    initialize : function(options) {
	        this.movies = options.movies;
	        this.templateHelpers = {
	            numberOfMovies : this.movies.length,
	            movies         : new Backbone.Collection(this.movies).toJSON()
	        };
	    },
	
	    _organize : function() {
	        var movieIds = _.pluck(this.movies, 'id');
	
	        CommandController.Execute('renameMovie', {
	            name      : 'renameMovie',
	            movieIds : movieIds
	        });
	
	        this.trigger('organizingFiles');
	        vent.trigger(vent.Commands.CloseModalCommand);
	    }
	});

/***/ },
/* 440 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	var EditSeriesView = __webpack_require__(441);
	var EditMovieView = __webpack_require__(442);
	var DeleteSeriesView = __webpack_require__(443);
	var EpisodeDetailsLayout = __webpack_require__(444);
	var HistoryDetailsLayout = __webpack_require__(456);
	var LogDetailsView = __webpack_require__(457);
	var RenamePreviewLayout = __webpack_require__(458);
	var ManualImportLayout = __webpack_require__(465);
	var FileBrowserLayout = __webpack_require__(229);
	
	module.exports = Marionette.AppRouter.extend({
	    initialize : function() {
	        vent.on(vent.Commands.OpenModalCommand, this._openModal, this);
	        vent.on(vent.Commands.CloseModalCommand, this._closeModal, this);
	        vent.on(vent.Commands.OpenModal2Command, this._openModal2, this);
	        vent.on(vent.Commands.CloseModal2Command, this._closeModal2, this);
	        vent.on(vent.Commands.EditSeriesCommand, this._editSeries, this);
	        vent.on(vent.Commands.EditMovieCommand, this._editMovie, this);
	        vent.on(vent.Commands.DeleteSeriesCommand, this._deleteSeries, this);
	        vent.on(vent.Commands.ShowEpisodeDetails, this._showEpisode, this);
	        vent.on(vent.Commands.ShowMovieDetails, this._showMovie, this);
	        vent.on(vent.Commands.ShowHistoryDetails, this._showHistory, this);
	        vent.on(vent.Commands.ShowLogDetails, this._showLogDetails, this);
	        vent.on(vent.Commands.ShowRenamePreview, this._showRenamePreview, this);
	        vent.on(vent.Commands.ShowManualImport, this._showManualImport, this);
	        vent.on(vent.Commands.ShowFileBrowser, this._showFileBrowser, this);
	        vent.on(vent.Commands.CloseFileBrowser, this._closeFileBrowser, this);
	    },
	
	    _openModal : function(view) {
	        AppLayout.modalRegion.show(view);
	    },
	
	    _closeModal : function() {
	        AppLayout.modalRegion.closeModal();
	    },
	
	    _openModal2 : function(view) {
	        AppLayout.modalRegion2.show(view);
	    },
	
	    _closeModal2 : function() {
	        AppLayout.modalRegion2.closeModal();
	    },
	
	    _editSeries : function(options) {
	        var view = new EditSeriesView({ model : options.series });
	        AppLayout.modalRegion.show(view);
	    },
	
	    _editMovie : function(options) {
	        var view = new EditMovieView({ model : options.movie });
	        AppLayout.modalRegion.show(view);
	    },
	
	    _deleteSeries : function(options) {
	        var view = new DeleteSeriesView({ model : options.series });
	        AppLayout.modalRegion.show(view);
	    },
	
	    _showEpisode : function(options) {
	        var view = new EpisodeDetailsLayout({
	            model          : options.episode,
	            hideSeriesLink : options.hideSeriesLink,
	            openingTab     : options.openingTab
	        });
	        AppLayout.modalRegion.show(view);
	    },
	
	    _showMovie : function(options) {
	        var view = new MoviesDetailsLayout({
	            model          : options.movie,
	            hideSeriesLink : options.hideSeriesLink,
	            openingTab     : options.openingTab
	        });
	        AppLayout.modalRegion.show(view);
	    },
	
	    _showHistory : function(options) {
	        var view = new HistoryDetailsLayout({ model : options.model });
	        AppLayout.modalRegion.show(view);
	    },
	
	    _showLogDetails : function(options) {
	        var view = new LogDetailsView({ model : options.model });
	        AppLayout.modalRegion.show(view);
	    },
	
	    _showRenamePreview : function(options) {
	        var view = new RenamePreviewLayout(options);
	        AppLayout.modalRegion.show(view);
	    },
	
	    _showManualImport : function(options) {
	        var view = new ManualImportLayout(options);
	        AppLayout.modalRegion.show(view);
	    },
	
	    _showFileBrowser : function(options) {
	        var view = new FileBrowserLayout(options);
	        AppLayout.modalRegion2.show(view);
	    },
	
	    _closeFileBrowser : function() {
	        AppLayout.modalRegion2.closeModal();
	    }
	});


/***/ },
/* 441 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Profiles = __webpack_require__(44);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	__webpack_require__(258);
	__webpack_require__(228);
	
	var view = Marionette.ItemView.extend({
	    template : 'Series/Edit/EditSeriesViewTemplate',
	
	    ui : {
	        profile : '.x-profile',
	        path    : '.x-path',
	        tags    : '.x-tags'
	    },
	
	    events : {
	        'click .x-remove' : '_removeSeries'
	    },
	
	    initialize : function() {
	        this.model.set('profiles', Profiles);
	    },
	
	    onRender : function() {
	        this.ui.path.fileBrowser();
	        this.ui.tags.tagInput({
	            model    : this.model,
	            property : 'tags'
	        });
	    },
	
	    _onBeforeSave : function() {
	        var profileId = this.ui.profile.val();
	        this.model.set({ profileId : profileId });
	    },
	
	    _onAfterSave : function() {
	        this.trigger('saved');
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _removeSeries : function() {
	        vent.trigger(vent.Commands.DeleteSeriesCommand, { series : this.model });
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	
	module.exports = view;

/***/ },
/* 442 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Profiles = __webpack_require__(44);
	var AsModelBoundView = __webpack_require__(218);
	var AsValidatedView = __webpack_require__(220);
	var AsEditModalView = __webpack_require__(250);
	__webpack_require__(258);
	__webpack_require__(228);
	
	var view = Marionette.ItemView.extend({
	    template : 'Movies/Edit/EditMovieTemplate',
	
	    ui : {
	        profile : '.x-profile',
	        path    : '.x-path',
	        tags    : '.x-tags'
	    },
	
	    events : {
	        'click .x-remove' : '_removeSeries'
	    },
	
	    initialize : function() {
	        this.model.set('profiles', Profiles);
	    },
	
	    onRender : function() {
	        this.ui.path.fileBrowser();
	        this.ui.tags.tagInput({
	            model    : this.model,
	            property : 'tags'
	        });
	    },
	
	    _onBeforeSave : function() {
	        var profileId = this.ui.profile.val();
	        this.model.set({ profileId : profileId });
	    },
	
	    _onAfterSave : function() {
	        this.trigger('saved');
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _removeSeries : function() {
	        vent.trigger(vent.Commands.DeleteSeriesCommand, { series : this.model });
	    }
	});
	
	AsModelBoundView.call(view);
	AsValidatedView.call(view);
	AsEditModalView.call(view);
	
	module.exports = view;


/***/ },
/* 443 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Series/Delete/DeleteSeriesTemplate',
	
	    events : {
	        'click .x-confirm-delete' : 'removeSeries',
	        'change .x-delete-files'  : 'changeDeletedFiles'
	    },
	
	    ui : {
	        deleteFiles     : '.x-delete-files',
	        deleteFilesInfo : '.x-delete-files-info',
	        indicator       : '.x-indicator'
	    },
	
	    removeSeries : function() {
	        var self = this;
	        var deleteFiles = this.ui.deleteFiles.prop('checked');
	        this.ui.indicator.show();
	
	        this.model.destroy({
	            data : { 'deleteFiles' : deleteFiles },
	            wait : true
	        }).done(function() {
	            vent.trigger(vent.Events.SeriesDeleted, { series : self.model });
	            vent.trigger(vent.Commands.CloseModalCommand);
	        });
	    },
	
	    changeDeletedFiles : function() {
	        var deleteFiles = this.ui.deleteFiles.prop('checked');
	
	        if (deleteFiles) {
	            this.ui.deleteFilesInfo.show();
	        } else {
	            this.ui.deleteFilesInfo.hide();
	        }
	    }
	});

/***/ },
/* 444 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var SummaryLayout = __webpack_require__(445);
	var SearchLayout = __webpack_require__(448);
	var EpisodeHistoryLayout = __webpack_require__(452);
	var SeriesCollection = __webpack_require__(123);
	var Messenger = __webpack_require__(55);
	
	module.exports = Marionette.Layout.extend({
	    className : 'modal-lg',
	    template  : 'Episode/EpisodeDetailsLayoutTemplate',
	
	    regions : {
	        summary : '#episode-summary',
	        history : '#episode-history',
	        search  : '#episode-search'
	    },
	
	    ui : {
	        summary   : '.x-episode-summary',
	        history   : '.x-episode-history',
	        search    : '.x-episode-search',
	        monitored : '.x-episode-monitored'
	    },
	
	    events : {
	
	        'click .x-episode-summary'   : '_showSummary',
	        'click .x-episode-history'   : '_showHistory',
	        'click .x-episode-search'    : '_showSearch',
	        'click .x-episode-monitored' : '_toggleMonitored'
	    },
	
	    templateHelpers : {},
	
	    initialize : function(options) {
	        this.templateHelpers.hideSeriesLink = options.hideSeriesLink;
	
	        this.series = SeriesCollection.get(this.model.get('seriesId'));
	        this.templateHelpers.series = this.series.toJSON();
	        this.openingTab = options.openingTab || 'summary';
	
	        this.listenTo(this.model, 'sync', this._setMonitoredState);
	    },
	
	    onShow : function() {
	        this.searchLayout = new SearchLayout({ model : this.model });
	
	        if (this.openingTab === 'search') {
	            this.searchLayout.startManualSearch = true;
	            this._showSearch();
	        }
	
	        else {
	            this._showSummary();
	        }
	
	        this._setMonitoredState();
	
	        if (this.series.get('monitored')) {
	            this.$el.removeClass('series-not-monitored');
	        }
	
	        else {
	            this.$el.addClass('series-not-monitored');
	        }
	    },
	
	    _showSummary : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.summary.tab('show');
	        this.summary.show(new SummaryLayout({
	            model  : this.model,
	            series : this.series
	        }));
	    },
	
	    _showHistory : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.history.tab('show');
	        this.history.show(new EpisodeHistoryLayout({
	            model  : this.model,
	            series : this.series
	        }));
	    },
	
	    _showSearch : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.ui.search.tab('show');
	        this.search.show(this.searchLayout);
	    },
	
	    _toggleMonitored : function() {
	        if (!this.series.get('monitored')) {
	
	            Messenger.show({
	                message : 'Unable to change monitored state when series is not monitored',
	                type    : 'error'
	            });
	
	            return;
	        }
	
	        var name = 'monitored';
	        this.model.set(name, !this.model.get(name), { silent : true });
	
	        this.ui.monitored.addClass('icon-sonarr-spinner fa-spin');
	        this.model.save();
	    },
	
	    _setMonitoredState : function() {
	        this.ui.monitored.removeClass('fa-spin icon-sonarr-spinner');
	
	        if (this.model.get('monitored')) {
	            this.ui.monitored.addClass('icon-sonarr-monitored');
	            this.ui.monitored.removeClass('icon-sonarr-unmonitored');
	        } else {
	            this.ui.monitored.addClass('icon-sonarr-unmonitored');
	            this.ui.monitored.removeClass('icon-sonarr-monitored');
	        }
	    }
	});


/***/ },
/* 445 */
/***/ function(module, exports, __webpack_require__) {

	var reqres = __webpack_require__(115);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var EpisodeFileModel = __webpack_require__(160);
	var EpisodeFileCollection = __webpack_require__(159);
	var FileSizeCell = __webpack_require__(147);
	var QualityCell = __webpack_require__(136);
	var DeleteEpisodeFileCell = __webpack_require__(446);
	var NoFileView = __webpack_require__(447);
	var LoadingView = __webpack_require__(117);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Episode/Summary/EpisodeSummaryLayoutTemplate',
	
	    regions : {
	        overview : '.episode-overview',
	        activity : '.episode-file-info'
	    },
	
	    columns : [
	        {
	            name     : 'path',
	            label    : 'Path',
	            cell     : 'string',
	            sortable : false
	        },
	        {
	            name     : 'size',
	            label    : 'Size',
	            cell     : FileSizeCell,
	            sortable : false
	        },
	        {
	            name     : 'quality',
	            label    : 'Quality',
	            cell     : QualityCell,
	            sortable : false,
	            editable : true
	        },
	        {
	            name     : 'this',
	            label    : '',
	            cell     : DeleteEpisodeFileCell,
	            sortable : false
	        }
	    ],
	
	    templateHelpers : {},
	
	    initialize : function(options) {
	        if (!this.model.series) {
	            this.templateHelpers.series = options.series.toJSON();
	        }
	    },
	
	    onShow : function() {
	        if (this.model.get('hasFile')) {
	            var episodeFileId = this.model.get('episodeFileId');
	
	            if (reqres.hasHandler(reqres.Requests.GetEpisodeFileById)) {
	                var episodeFile = reqres.request(reqres.Requests.GetEpisodeFileById, episodeFileId);
	                this.episodeFileCollection = new EpisodeFileCollection(episodeFile, { seriesId : this.model.get('seriesId') });
	                this.listenTo(episodeFile, 'destroy', this._episodeFileDeleted);
	
	                this._showTable();
	            }
	
	            else {
	                this.activity.show(new LoadingView());
	
	                var self = this;
	                var newEpisodeFile = new EpisodeFileModel({ id : episodeFileId });
	                this.episodeFileCollection = new EpisodeFileCollection(newEpisodeFile, { seriesId : this.model.get('seriesId') });
	                var promise = newEpisodeFile.fetch();
	                this.listenTo(newEpisodeFile, 'destroy', this._episodeFileDeleted);
	
	                promise.done(function() {
	                    self._showTable();
	                });
	            }
	
	            this.listenTo(this.episodeFileCollection, 'add remove', this._collectionChanged);
	        }
	
	        else {
	            this._showNoFileView();
	        }
	    },
	
	    _showTable : function() {
	        this.activity.show(new Backgrid.Grid({
	            collection : this.episodeFileCollection,
	            columns    : this.columns,
	            className  : 'table table-bordered',
	            emptyText  : 'Nothing to see here!'
	        }));
	    },
	
	    _showNoFileView : function() {
	        this.activity.show(new NoFileView());
	    },
	
	    _collectionChanged : function() {
	        if (!this.episodeFileCollection.any()) {
	            this._showNoFileView();
	        }
	
	        else {
	            this._showTable();
	        }
	    },
	
	    _episodeFileDeleted : function() {
	        this.model.set({
	            episodeFileId : 0,
	            hasFile       : false
	        });
	    }
	});

/***/ },
/* 446 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Cell.extend({
	    className : 'delete-episode-file-cell',
	
	    events : {
	        'click' : '_onClick'
	    },
	
	    render : function() {
	        this.$el.empty();
	        this.$el.html('<i class="icon-sonarr-delete" title="Delete episode file from disk"></i>');
	
	        return this;
	    },
	
	    _onClick : function() {
	        var self = this;
	
	        if (window.confirm('Are you sure you want to delete \'{0}\' from disk?'.format(this.model.get('path')))) {
	            this.model.destroy().done(function() {
	                vent.trigger(vent.Events.EpisodeFileDeleted, { episodeFile : self.model });
	            });
	        }
	    }
	});

/***/ },
/* 447 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Episode/Summary/NoFileViewTemplate'
	});

/***/ },
/* 448 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var ButtonsView = __webpack_require__(449);
	var ManualSearchLayout = __webpack_require__(450);
	var ReleaseCollection = __webpack_require__(154);
	var CommandController = __webpack_require__(86);
	var LoadingView = __webpack_require__(117);
	var NoResultsView = __webpack_require__(451);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Episode/Search/EpisodeSearchLayoutTemplate',
	
	    regions : {
	        main : '#episode-search-region'
	    },
	
	    events : {
	        'click .x-search-auto'   : '_searchAuto',
	        'click .x-search-manual' : '_searchManual',
	        'click .x-search-back'   : '_showButtons'
	    },
	
	    initialize : function() {
	        this.mainView = new ButtonsView();
	        this.releaseCollection = new ReleaseCollection();
	
	        this.listenTo(this.releaseCollection, 'sync', this._showSearchResults);
	    },
	
	    onShow : function() {
	        if (this.startManualSearch) {
	            this._searchManual();
	        }
	
	        else {
	            this._showMainView();
	        }
	    },
	
	    _searchAuto : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        CommandController.Execute('episodeSearch', {
	            episodeIds : [this.model.get('id')]
	        });
	
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _searchManual : function(e) {
	        if (e) {
	            e.preventDefault();
	        }
	
	        this.mainView = new LoadingView();
	        this._showMainView();
	        this.releaseCollection.fetchEpisodeReleases(this.model.id);
	    },
	
	    _showMainView : function() {
	        this.main.show(this.mainView);
	    },
	
	    _showButtons : function() {
	        this.mainView = new ButtonsView();
	        this._showMainView();
	    },
	
	    _showSearchResults : function() {
	        if (this.releaseCollection.length === 0) {
	            this.mainView = new NoResultsView();
	        }
	
	        else {
	            this.mainView = new ManualSearchLayout({ collection : this.releaseCollection });
	        }
	
	        this._showMainView();
	    }
	});

/***/ },
/* 449 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Episode/Search/ButtonsViewTemplate'
	});

/***/ },
/* 450 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var ReleaseTitleCell = __webpack_require__(146);
	var FileSizeCell = __webpack_require__(147);
	var QualityCell = __webpack_require__(136);
	var ApprovalStatusCell = __webpack_require__(148);
	var DownloadReportCell = __webpack_require__(149);
	var AgeCell = __webpack_require__(150);
	var ProtocolCell = __webpack_require__(151);
	var PeersCell = __webpack_require__(152);
	var EditionCell = __webpack_require__(153);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Episode/Search/ManualLayoutTemplate',
	
	    regions : {
	        grid : '#episode-release-grid'
	    },
	
	    columns : [
	        {
	            name  : 'protocol',
	            label : 'Source',
	            cell  : ProtocolCell
	        },
	        {
	            name  : 'age',
	            label : 'Age',
	            cell  : AgeCell
	        },
	        {
	            name  : 'title',
	            label : 'Title',
	            cell  : ReleaseTitleCell
	        },
	        {
	            name  : 'edition',
	            label : 'Edition',
	            cell  : EditionCell,
	            title : "Edition"
	        },
	        {
	            name  : 'indexer',
	            label : 'Indexer',
	            cell  : Backgrid.StringCell
	        },
	        {
	            name  : 'size',
	            label : 'Size',
	            cell  : FileSizeCell
	        },
	        {
	            name  : 'seeders',
	            label : 'Peers',
	            cell  : PeersCell
	        },
	        {
	            name  : 'quality',
	            label : 'Quality',
	            cell  : QualityCell
	        },
	        {
	            name      : 'rejections',
	            label     : '<i class="icon-sonarr-header-rejections" />',
	            tooltip   : 'Rejections',
	            cell      : ApprovalStatusCell,
	            sortable  : true,
	            sortType  : 'fixed',
	            direction : 'ascending',
	            title     : 'Release Rejected'
	        },
	        {
	            name      : 'download',
	            label     : '<i class="icon-sonarr-download" />',
	            tooltip   : 'Auto-Search Prioritization',
	            cell      : DownloadReportCell,
	            sortable  : true,
	            sortType  : 'fixed',
	            direction : 'ascending'
	        }
	    ],
	
	    onShow : function() {
	        if (!this.isClosed) {
	            this.grid.show(new Backgrid.Grid({
	                row        : Backgrid.Row,
	                columns    : this.columns,
	                collection : this.collection,
	                className  : 'table table-hover'
	            }));
	        }
	    }
	});


/***/ },
/* 451 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Episode/Search/NoResultsViewTemplate'
	});

/***/ },
/* 452 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var HistoryCollection = __webpack_require__(133);
	var EventTypeCell = __webpack_require__(135);
	var QualityCell = __webpack_require__(136);
	var RelativeDateCell = __webpack_require__(127);
	var EpisodeHistoryActionsCell = __webpack_require__(453);
	var EpisodeHistoryDetailsCell = __webpack_require__(454);
	var NoHistoryView = __webpack_require__(455);
	var LoadingView = __webpack_require__(117);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Episode/History/EpisodeHistoryLayoutTemplate',
	
	    regions : {
	        historyTable : '.history-table'
	    },
	
	    columns : [
	        {
	            name      : 'eventType',
	            label     : '',
	            cell      : EventTypeCell,
	            cellValue : 'this'
	        },
	        {
	            name  : 'sourceTitle',
	            label : 'Source Title',
	            cell  : 'string'
	        },
	        {
	            name  : 'quality',
	            label : 'Quality',
	            cell  : QualityCell
	        },
	        {
	            name  : 'date',
	            label : 'Date',
	            cell  : RelativeDateCell
	        },
	        {
	            name     : 'this',
	            label    : '',
	            cell     : EpisodeHistoryDetailsCell,
	            sortable : false
	        },
	        {
	            name     : 'this',
	            label    : '',
	            cell     : EpisodeHistoryActionsCell,
	            sortable : false
	        }
	    ],
	
	    initialize : function(options) {
	        this.model = options.model;
	        this.series = options.series;
	
	        this.collection = new HistoryCollection({
	            episodeId : this.model.id,
	            tableName : 'episodeHistory'
	        });
	        this.collection.fetch();
	        this.listenTo(this.collection, 'sync', this._showTable);
	    },
	
	    onRender : function() {
	        this.historyTable.show(new LoadingView());
	    },
	
	    _showTable : function() {
	        if (this.collection.any()) {
	            this.historyTable.show(new Backgrid.Grid({
	                collection : this.collection,
	                columns    : this.columns,
	                className  : 'table table-hover table-condensed'
	            }));
	        }
	
	        else {
	            this.historyTable.show(new NoHistoryView());
	        }
	    }
	});

/***/ },
/* 453 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-actions-cell',
	
	    events : {
	        'click .x-failed' : '_markAsFailed'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.model.get('eventType') === 'grabbed') {
	            this.$el.html('<i class="icon-sonarr-delete x-failed" title="Mark download as failed"></i>');
	        }
	
	        return this;
	    },
	
	    _markAsFailed : function() {
	        var url = window.NzbDrone.ApiRoot + '/history/failed';
	        var data = {
	            id : this.model.get('id')
	        };
	
	        $.ajax({
	            url  : url,
	            type : 'POST',
	            data : data
	        });
	    }
	});

/***/ },
/* 454 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var NzbDroneCell = __webpack_require__(96);
	var HistoryDetailsView = __webpack_require__(140);
	__webpack_require__(73);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episode-history-details-cell',
	
	    render : function() {
	        this.$el.empty();
	        this.$el.html('<i class="icon-sonarr-form-info"></i>');
	
	        var html = new HistoryDetailsView({ model : this.model }).render().$el;
	
	        this.$el.popover({
	            content   : html,
	            html      : true,
	            trigger   : 'hover',
	            title     : 'Details',
	            placement : 'left',
	            container : this.$el
	        });
	
	        return this;
	    }
	});

/***/ },
/* 455 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Episode/History/NoHistoryViewTemplate'
	});

/***/ },
/* 456 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var HistoryDetailsView = __webpack_require__(140);
	
	module.exports = Marionette.Layout.extend({
	    template : 'Activity/History/Details/HistoryDetailsLayoutTemplate',
	
	    regions : {
	        bodyRegion : '.modal-body'
	    },
	
	    events : {
	        'click .x-mark-as-failed' : '_markAsFailed'
	    },
	
	    onShow : function() {
	        this.bodyRegion.show(new HistoryDetailsView({ model : this.model }));
	    },
	
	    _markAsFailed : function() {
	        var url = window.NzbDrone.ApiRoot + '/history/failed';
	        var data = {
	            id : this.model.get('id')
	        };
	
	        $.ajax({
	            url  : url,
	            type : 'POST',
	            data : data
	        });
	
	        vent.trigger(vent.Commands.CloseModalCommand);
	    }
	});


/***/ },
/* 457 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'System/Logs/Table/Details/LogDetailsViewTemplate'
	});

/***/ },
/* 458 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var RenamePreviewCollection = __webpack_require__(459);
	var RenamePreviewCollectionView = __webpack_require__(461);
	var EmptyCollectionView = __webpack_require__(463);
	var RenamePreviewFormatView = __webpack_require__(464);
	var LoadingView = __webpack_require__(117);
	var CommandController = __webpack_require__(86);
	
	module.exports = Marionette.Layout.extend({
	    className : 'modal-lg',
	    template  : 'Rename/RenamePreviewLayoutTemplate',
	
	    regions : {
	        renamePreviews : '#rename-previews',
	        formatRegion   : '.x-format-region'
	    },
	
	    ui : {
	        pathInfo     : '.x-path-info',
	        renameAll    : '.x-rename-all',
	        checkboxIcon : '.x-rename-all-button i'
	    },
	
	    events : {
	        'click .x-organize'    : '_organizeFiles',
	        'change .x-rename-all' : '_toggleAll'
	    },
	
	    initialize : function(options) {
	        this.model = options.movie;
	        this.seasonNumber = options.seasonNumber;
	
	        var viewOptions = {};
	        //viewOptions.seriesId = this.model.id;
	        //viewOptions.seasonNumber = this.seasonNumber;
	        viewOptions.movieId = this.model.id;
	
	        this.collection = new RenamePreviewCollection(viewOptions);
	        this.listenTo(this.collection, 'sync', this._showPreviews);
	        this.listenTo(this.collection, 'rename:select', this._itemRenameChanged);
	
	        this.collection.fetch();
	    },
	
	    onRender : function() {
	        this.renamePreviews.show(new LoadingView());
	        this.formatRegion.show(new RenamePreviewFormatView({ model : this.model }));
	    },
	
	    _showPreviews : function() {
	        if (this.collection.length === 0) {
	            this.ui.pathInfo.hide();
	            this.renamePreviews.show(new EmptyCollectionView());
	            return;
	        }
	
	        this.ui.pathInfo.show();
	        this.collection.invoke('set', { rename : true });
	        this.renamePreviews.show(new RenamePreviewCollectionView({ collection : this.collection }));
	    },
	
	    _organizeFiles : function() {
	        if (this.collection.length === 0) {
	            vent.trigger(vent.Commands.CloseModalCommand);
	        }
	
	        var files = _.map(this.collection.where({ rename : true }), function(model) {
	            //return model.get('episodeFileId');
	            return model.get('movieFileId');
	        });
	
	        if (files.length === 0) {
	            vent.trigger(vent.Commands.CloseModalCommand);
	            return;
	        }
	
	        CommandController.Execute('renameMovieFiles', {
	            name         : 'renameMovieFiles',
	            movieId     : this.model.id,
	            files        : files
	        });
	
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _setCheckedState : function(checked) {
	        if (checked) {
	            this.ui.checkboxIcon.addClass('icon-sonarr-checked');
	            this.ui.checkboxIcon.removeClass('icon-sonarr-unchecked');
	        } else {
	            this.ui.checkboxIcon.addClass('icon-sonarr-unchecked');
	            this.ui.checkboxIcon.removeClass('icon-sonarr-checked');
	        }
	    },
	
	    _toggleAll : function() {
	        var checked = this.ui.renameAll.prop('checked');
	        this._setCheckedState(checked);
	
	        this.collection.each(function(model) {
	            model.trigger('rename:select', model, checked);
	        });
	    },
	
	    _itemRenameChanged : function(model, checked) {
	        var allChecked = this.collection.all(function(m) {
	            return m.get('rename');
	        });
	
	        if (!checked || allChecked) {
	            this._setCheckedState(checked);
	        }
	    }
	});

/***/ },
/* 459 */
/***/ function(module, exports, __webpack_require__) {

	// var Backbone = require('backbone');
	// var RenamePreviewModel = require('./RenamePreviewModel');
	
	// module.exports = Backbone.Collection.extend({
	//     url   : window.NzbDrone.ApiRoot + '/rename',
	//     model : RenamePreviewModel,
	
	//     originalFetch : Backbone.Collection.prototype.fetch,
	
	//     initialize : function(options) {
	//         if (!options.seriesId) {
	//             throw 'seriesId is required';
	//         }
	
	//         this.seriesId = options.seriesId;
	//         this.seasonNumber = options.seasonNumber;
	//     },
	
	//     fetch : function(options) {
	//         if (!this.seriesId) {
	//             throw 'seriesId is required';
	//         }
	
	//         options = options || {};
	//         options.data = {};
	//         options.data.seriesId = this.seriesId;
	
	//         if (this.seasonNumber !== undefined) {
	//             options.data.seasonNumber = this.seasonNumber;
	//         }
	
	//         return this.originalFetch.call(this, options);
	//     }
	// });
	
	var Backbone = __webpack_require__(6);
	var RenamePreviewModel = __webpack_require__(460);
	
	module.exports = Backbone.Collection.extend({
	    url   : window.NzbDrone.ApiRoot + '/rename',
	    model : RenamePreviewModel,
	
	    originalFetch : Backbone.Collection.prototype.fetch,
	
	    initialize : function(options) {
	        if (!options.movieId) {
	            throw 'movieId is required';
	        }
	
	        this.movieId = options.movieId;
	        //this.seasonNumber = options.seasonNumber;
	    },
	
	    fetch : function(options) {
	        if (!this.movieId) {
	            throw 'movieId is required';
	        }
	
	        options = options || {};
	        options.data = {};
	        options.data.movieId = this.movieId;
	
	        // if (this.seasonNumber !== undefined) {
	        //     options.data.seasonNumber = this.seasonNumber;
	        //}
	
	        return this.originalFetch.call(this, options);
	    }
	});

/***/ },
/* 460 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({});

/***/ },
/* 461 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	var RenamePreviewItemView = __webpack_require__(462);
	
	module.exports = Marionette.CollectionView.extend({
	    itemView : RenamePreviewItemView
	});

/***/ },
/* 462 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var AsModelBoundView = __webpack_require__(218);
	
	var view = Marionette.ItemView.extend({
	    template : 'Rename/RenamePreviewItemViewTemplate',
	
	    ui : {
	        itemDiv      : '.rename-preview-item',
	        checkboxIcon : '.rename-checkbox i'
	    },
	
	    onRender : function() {
	        this._setItemState();
	        this.listenTo(this.model, 'change', this._setItemState);
	        this.listenTo(this.model, 'rename:select', this._onRenameAll);
	    },
	
	    _setItemState : function() {
	        var checked = this.model.get('rename');
	        this.model.trigger('rename:select', this.model, checked);
	
	        if (checked) {
	            this.ui.itemDiv.removeClass('do-not-rename');
	            this.ui.checkboxIcon.addClass('icon-sonarr-checked');
	            this.ui.checkboxIcon.removeClass('icon-sonarr-unchecked');
	        } else {
	            this.ui.itemDiv.addClass('do-not-rename');
	            this.ui.checkboxIcon.addClass('icon-sonarr-unchecked');
	            this.ui.checkboxIcon.removeClass('icon-sonarr-checked');
	        }
	    },
	
	    _onRenameAll : function(model, checked) {
	        this.model.set('rename', checked);
	    }
	});
	
	module.exports = AsModelBoundView.apply(view);

/***/ },
/* 463 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Rename/RenamePreviewEmptyCollectionViewTemplate'
	});

/***/ },
/* 464 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var NamingModel = __webpack_require__(212);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Rename/RenamePreviewFormatViewTemplate',
	
	    templateHelpers : function() {
	        var type = this.model.get('seriesType');
	        return {
	            rename : this.naming.get('renameEpisodes'),
	            format : this.naming.get(type + 'EpisodeFormat')
	        };
	    },
	
	    initialize : function() {
	        this.naming = new NamingModel();
	        this.naming.fetch();
	        this.listenTo(this.naming, 'sync', this.render);
	    }
	});

/***/ },
/* 465 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var CommandController = __webpack_require__(86);
	var EmptyView = __webpack_require__(466);
	var SelectFolderView = __webpack_require__(467);
	var LoadingView = __webpack_require__(117);
	var ManualImportRow = __webpack_require__(468);
	var SelectAllCell = __webpack_require__(119);
	var PathCell = __webpack_require__(469);
	var SeriesCell = __webpack_require__(470);
	var SeasonCell = __webpack_require__(473);
	var EpisodesCell = __webpack_require__(475);
	var QualityCell = __webpack_require__(478);
	var FileSizeCell = __webpack_require__(147);
	var ApprovalStatusCell = __webpack_require__(148);
	var ManualImportCollection = __webpack_require__(481);
	var Messenger = __webpack_require__(55);
	
	module.exports = Marionette.Layout.extend({
	    className : 'modal-lg',
	    template  : 'ManualImport/ManualImportLayoutTemplate',
	
	    regions : {
	        workspace  : '.x-workspace'
	    },
	
	    ui : {
	        importButton : '.x-import',
	        importMode   : '.x-importmode'
	    },
	
	    events : {
	        'click .x-import' : '_import'
	    },
	
	    columns : [
	        {
	            name       : '',
	            cell       : SelectAllCell,
	            headerCell : 'select-all',
	            sortable   : false
	        },
	        {
	            name       : 'relativePath',
	            label      : 'Relative Path',
	            cell       : PathCell,
	            sortable   : true
	        },
	        {
	            name       : 'series',
	            label      : 'Series',
	            cell       : SeriesCell,
	            sortable   : true
	        },
	        {
	            name       : 'seasonNumber',
	            label      : 'Season',
	            cell       : SeasonCell,
	            sortable   : true
	        },
	        {
	            name       : 'episodes',
	            label      : 'Episode(s)',
	            cell       : EpisodesCell,
	            sortable   : false
	        },
	        {
	            name       : 'quality',
	            label      : 'Quality',
	            cell       : QualityCell,
	            sortable   : true
	
	        },
	        {
	            name       : 'size',
	            label      : 'Size',
	            cell       : FileSizeCell,
	            sortable   : true
	        },
	        {
	            name       : 'rejections',
	            label      : '<i class="icon-sonarr-header-rejections" />',
	            tooltip    : 'Rejections',
	            cell       : ApprovalStatusCell,
	            sortable   : false,
	            sortType   : 'fixed',
	            direction  : 'ascending',
	            title      : 'Import Rejected'
	        }
	    ],
	
	    initialize : function(options) {
	        this.folder = options.folder;
	        this.downloadId = options.downloadId;
	        this.title = options.title;
	        this.importMode = options.importMode || 'Move';
	
	        this.templateHelpers = {
	            title : this.title || this.folder
	        };
	    },
	
	    onRender : function() {
	
	        if (this.folder || this.downloadId) {
	            this._showLoading();
	            this._loadCollection();
	            this.ui.importMode.val(this.importMode);
	        }
	
	        else {
	            this._showSelectFolder();
	            this.ui.importButton.hide();
	            this.ui.importMode.hide();
	        }
	    },
	
	    _showLoading : function () {
	        this.workspace.show(new LoadingView());
	    },
	
	    _loadCollection : function () {
	        this.manualImportCollection = new ManualImportCollection({ folder: this.folder, downloadId: this.downloadId });
	        this.manualImportCollection.fetch();
	
	        this.listenTo(this.manualImportCollection, 'sync', this._showTable);
	        this.listenTo(this.manualImportCollection, 'backgrid:selected', this._updateButtons);
	    },
	
	    _showTable : function () {
	        if (this.manualImportCollection.length === 0) {
	            this.workspace.show(new EmptyView());
	            return;
	        }
	
	        this.fileView = new Backgrid.Grid({
	            columns    : this.columns,
	            collection : this.manualImportCollection,
	            className  : 'table table-hover',
	            row        : ManualImportRow
	        });
	
	        this.workspace.show(this.fileView);
	        this._updateButtons();
	    },
	
	    _showSelectFolder : function () {
	        this.selectFolderView = new SelectFolderView();
	        this.workspace.show(this.selectFolderView);
	
	        this.listenTo(this.selectFolderView, 'manualImport', this._manualImport);
	        this.listenTo(this.selectFolderView, 'automaticImport', this._automaticImport);
	    },
	
	    _manualImport : function (e) {
	        this.folder = e.folder;
	        this.templateHelpers.title = this.folder;
	        this.render();
	    },
	
	    _automaticImport : function (e) {
	        CommandController.Execute('downloadedEpisodesScan', {
	            name : 'downloadedEpisodesScan',
	            path : e.folder
	        });
	
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _import : function () {
	        var selected = this.fileView.getSelectedModels();
	
	        if (selected.length === 0) {
	            return;
	        }
	
	        if (_.any(selected, function (model) {
	                return !model.has('series');
	            })) {
	
	            this._showErrorMessage('Series must be chosen for each selected file');
	            return;
	        }
	
	        if (_.any(selected, function (model) {
	                return !model.has('seasonNumber');
	            })) {
	
	            this._showErrorMessage('Season must be chosen for each selected file');
	            return;
	        }
	
	        if (_.any(selected, function (model) {
	                return !model.has('episodes') || model.get('episodes').length === 0;
	            })) {
	
	            this._showErrorMessage('One or more episodes must be chosen for each selected file');
	            return;
	        }
	
	        var importMode = this.ui.importMode.val();
	
	        CommandController.Execute('manualImport', {
	            name  : 'manualImport',
	            files : _.map(selected, function (file) {
	                return {
	                    path       : file.get('path'),
	                    seriesId   : file.get('series').id,
	                    episodeIds : _.map(file.get('episodes'), 'id'),
	                    quality    : file.get('quality'),
	                    downloadId : file.get('downloadId')
	                };
	            }),
	            importMode : importMode
	        });
	
	        vent.trigger(vent.Commands.CloseModalCommand);
	    },
	
	    _updateButtons : function (model, selected) {
	        if (!this.fileView) {
	            this.ui.importButton.attr('disabled', 'disabled');
	            return;
	        }
	
	        if (!model) {
	            return;
	        }
	
	        var selectedModels = this.fileView.getSelectedModels();
	        var selectedCount = 0;
	
	        if (selected) {
	            selectedCount = _.any(selectedModels, { id : model.id }) ? selectedModels.length : selectedModels.length + 1;
	        }
	
	        else {
	            selectedCount = _.any(selectedModels, { id : model.id }) ? selectedModels.length - 1 : selectedModels.length;
	        }
	
	        if (selectedCount === 0) {
	            this.ui.importButton.attr('disabled', 'disabled');
	        }
	
	        else {
	            this.ui.importButton.removeAttr('disabled');
	        }
	    },
	
	    _showErrorMessage : function (message) {
	        Messenger.show({
	            message   : message,
	            type      : 'error',
	            hideAfter : 5
	        });
	    }
	});

/***/ },
/* 466 */
/***/ function(module, exports, __webpack_require__) {

	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.CompositeView.extend({
	    template : 'ManualImport/EmptyViewTemplate'
	});

/***/ },
/* 467 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var $ = __webpack_require__(1);
	var Config = __webpack_require__(35);
	var Marionette = __webpack_require__(11);
	var moment = __webpack_require__(17);
	__webpack_require__(228);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'ManualImport/Folder/SelectFolderViewTemplate',
	
	    ui : {
	        path    : '.x-path',
	        buttons : '.x-button'
	    },
	
	    events: {
	        'click .x-manual-import'    : '_manualImport',
	        'click .x-automatic-import' : '_automaticImport',
	        'change .x-path'            : '_updateButtons',
	        'keyup .x-path'             : '_updateButtons',
	        'click .x-recent-folder'    : '_selectRecentFolder'
	    },
	
	    initialize : function () {
	        this.templateHelpers = {
	            recentFolders: Config.getValueJson('manualimport.recentfolders', [])
	        };
	    },
	
	    onRender : function() {
	        this.ui.path.fileBrowser();
	        this._updateButtons();
	    },
	
	    path : function() {
	        return this.ui.path.val();
	    },
	
	    _manualImport : function () {
	        var path = this.ui.path.val();
	
	        if (path) {
	            this._setRecentFolders(path);
	            this.trigger('manualImport', { folder: path });
	        }
	    },
	
	    _automaticImport : function () {
	        var path = this.ui.path.val();
	
	        if (path) {
	            this._setRecentFolders(path);
	            this.trigger('automaticImport', { folder: path });
	        }
	    },
	
	    _updateButtons : function () {
	        if (this.ui.path.val()) {
	            this.ui.buttons.removeAttr('disabled');
	        }
	
	        else {
	            this.ui.buttons.attr('disabled', 'disabled');
	        }
	    },
	
	    _selectRecentFolder : function (e) {
	        var path = $(e.target).closest('tr').data('path');
	        this.ui.path.val(path);
	        this.ui.path.trigger('change');
	    },
	
	    _setRecentFolders : function (path) {
	        var recentFolders = Config.getValueJson('manualimport.recentfolders', []);
	
	        recentFolders = _.filter(recentFolders, function (folder) {
	            return folder.path.toLowerCase() !== path.toLowerCase();
	        });
	
	        recentFolders.unshift({ path: path, lastUsed: moment.utc().toISOString() });
	
	        Config.setValueJson('manualimport.recentfolders', _.take(recentFolders, 5));
	    }
	});


/***/ },
/* 468 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Row.extend({
	    className : 'manual-import-row',
	
	    _originalInit : Backgrid.Row.prototype.initialize,
	    _originalRender : Backgrid.Row.prototype.render,
	
	    initialize : function () {
	        this._originalInit.apply(this, arguments);
	
	        this.listenTo(this.model, 'change', this._setError);
	        this.listenTo(this.model, 'change', this._setClasses);
	    },
	
	    render : function () {
	        this._originalRender.apply(this, arguments);
	        this._setError();
	        this._setClasses();
	
	        return this;
	    },
	
	    _setError : function () {
	        if (this.model.has('series') &&
	            this.model.has('seasonNumber') &&
	            (this.model.has('episodes') && this.model.get('episodes').length > 0)&&
	            this.model.has('quality')) {
	            this.$el.removeClass('manual-import-error');
	        }
	
	        else {
	            this.$el.addClass('manual-import-error');
	        }
	    },
	
	    _setClasses : function () {
	        this.$el.toggleClass('has-series', this.model.has('series'));
	        this.$el.toggleClass('has-season', this.model.has('seasonNumber'));
	    }
	});

/***/ },
/* 469 */
/***/ function(module, exports, __webpack_require__) {

	var NzbDroneCell = __webpack_require__(96);
	
	module.exports = NzbDroneCell.extend({
	    className : 'path-cell',
	
	    render : function() {
	        this.$el.empty();
	
	        var relativePath = this.model.get('relativePath');
	        var path = this.model.get('path');
	
	        this.$el.html('<div title="{0}">{1}</div>'.format(path, relativePath));
	
	        return this;
	    }
	});

/***/ },
/* 470 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	var SelectSeriesLayout = __webpack_require__(471);
	
	module.exports = NzbDroneCell.extend({
	    className : 'series-title-cell editable',
	
	    events : {
	        'click' : '_onClick'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        var series = this.model.get('series');
	
	        if (series)
	        {
	            this.$el.html(series.title);
	        }
	
	        this.delegateEvents();
	        return this;
	    },
	
	    _onClick : function () {
	        var view = new SelectSeriesLayout();
	
	        this.listenTo(view, 'manualimport:selected:series', this._setSeries);
	
	        vent.trigger(vent.Commands.OpenModal2Command, view);
	    },
	
	    _setSeries : function (e) {
	        if (this.model.has('series') && e.model.id === this.model.get('series').id) {
	            return;
	        }
	
	        this.model.set({
	            series       : e.model.toJSON(),
	            seasonNumber : undefined,
	            episodes     : []
	        });
	    }
	});

/***/ },
/* 471 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var SeriesCollection = __webpack_require__(123);
	var SelectRow = __webpack_require__(472);
	
	module.exports = Marionette.Layout.extend({
	    template  : 'ManualImport/Series/SelectSeriesLayoutTemplate',
	
	    regions : {
	        series : '.x-series'
	    },
	
	    ui : {
	        filter : '.x-filter'
	    },
	
	    columns : [
	        {
	            name      : 'title',
	            label     : 'Title',
	            cell      : 'String',
	            sortValue : 'sortTitle'
	        }
	    ],
	
	    initialize : function() {
	        this.seriesCollection = SeriesCollection.clone();
	        this._setModelCollection();
	
	        this.listenTo(this.seriesCollection, 'row:selected', this._onSelected);
	        this.listenTo(this, 'modal:afterShow', this._setFocus);
	    },
	
	    onRender : function() {
	        this.seriesView = new Backgrid.Grid({
	            columns    : this.columns,
	            collection : this.seriesCollection,
	            className  : 'table table-hover season-grid',
	            row        : SelectRow
	        });
	
	        this.series.show(this.seriesView);
	        this._setupFilter();
	    },
	
	    _setupFilter : function () {
	        var self = this;
	
	        //TODO: This should be a mixin (same as Add Series searching)
	        this.ui.filter.keyup(function(e) {
	            if (_.contains([
	                    9,
	                    16,
	                    17,
	                    18,
	                    19,
	                    20,
	                    33,
	                    34,
	                    35,
	                    36,
	                    37,
	                    38,
	                    39,
	                    40,
	                    91,
	                    92,
	                    93
	                ], e.keyCode)) {
	                return;
	            }
	
	            self._filter(self.ui.filter.val());
	        });
	    },
	
	    _filter : function (term) {
	        this.seriesCollection.setFilter(['title', term, 'contains']);
	        this._setModelCollection();
	    },
	
	    _onSelected : function (e) {
	        this.trigger('manualimport:selected:series', { model: e.model });
	
	        vent.trigger(vent.Commands.CloseModal2Command);
	    },
	
	    _setFocus : function () {
	        this.ui.filter.focus();
	    },
	    
	    _setModelCollection: function () {
	        var self = this;
	        
	        _.each(this.seriesCollection.models, function (model) {
	            model.collection = self.seriesCollection;
	        });
	    }
	});


/***/ },
/* 472 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Row.extend({
	    className : 'select-row select-series-row',
	
	    events : {
	        'click' : '_onClick'
	    },
	
	    _onClick : function() {
	        this.model.collection.trigger('row:selected', { model: this.model });
	    }
	});

/***/ },
/* 473 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	var SelectSeasonLayout = __webpack_require__(474);
	
	module.exports = NzbDroneCell.extend({
	    className : 'season-cell',
	
	    events : {
	        'click' : '_onClick'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        if (this.model.has('seasonNumber')) {
	            this.$el.html(this.model.get('seasonNumber'));
	        }
	
	        this.delegateEvents();
	        return this;
	    },
	
	    _onClick : function () {
	        var series = this.model.get('series');
	
	        if (!series) {
	            return;
	        }
	
	        var view = new SelectSeasonLayout({ seasons: series.seasons });
	
	        this.listenTo(view, 'manualimport:selected:season', this._setSeason);
	
	        vent.trigger(vent.Commands.OpenModal2Command, view);
	    },
	
	    _setSeason : function (e) {
	        if (this.model.has('seasonNumber') && e.seasonNumber === this.model.get('seasonNumber')) {
	            return;
	        }
	
	        this.model.set({
	            seasonNumber : e.seasonNumber,
	            episodes     : []
	        });
	    }
	});

/***/ },
/* 474 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.Layout.extend({
	    template  : 'ManualImport/Season/SelectSeasonLayoutTemplate',
	
	    events : {
	        'change .x-select-season' : '_selectSeason'
	    },
	
	    initialize : function(options) {
	
	        this.templateHelpers = {
	            seasons : options.seasons
	        };
	    },
	
	    _selectSeason : function (e) {
	        var seasonNumber = parseInt(e.target.value, 10);
	
	        if (seasonNumber === -1) {
	            return;
	        }
	
	        this.trigger('manualimport:selected:season', { seasonNumber: seasonNumber });
	        vent.trigger(vent.Commands.CloseModal2Command);
	    }
	});

/***/ },
/* 475 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var NzbDroneCell = __webpack_require__(96);
	var SelectEpisodeLayout = __webpack_require__(476);
	
	module.exports = NzbDroneCell.extend({
	    className : 'episodes-cell',
	
	    events : {
	        'click' : '_onClick'
	    },
	
	    render : function() {
	        this.$el.empty();
	
	        var episodes = this.model.get('episodes');
	
	        if (episodes)
	        {
	            var episodeNumbers = _.map(episodes, 'episodeNumber');
	
	            this.$el.html(episodeNumbers.join(', '));
	        }
	
	        return this;
	    },
	
	    _onClick : function () {
	        var series = this.model.get('series');
	        var seasonNumber = this.model.get('seasonNumber');
	
	        if (series === undefined || seasonNumber === undefined) {
	            return;
	        }
	
	        var view =  new SelectEpisodeLayout({ series: series, seasonNumber: seasonNumber });
	
	        this.listenTo(view, 'manualimport:selected:episodes', this._setEpisodes);
	
	        vent.trigger(vent.Commands.OpenModal2Command, view);
	    },
	
	    _setEpisodes : function (e) {
	        this.model.set('episodes', e.episodes);
	    }
	});

/***/ },
/* 476 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var Backgrid = __webpack_require__(80);
	var EpisodeCollection = __webpack_require__(128);
	var LoadingView = __webpack_require__(117);
	var SelectAllCell = __webpack_require__(119);
	var EpisodeNumberCell = __webpack_require__(122);
	var RelativeDateCell = __webpack_require__(127);
	var SelectEpisodeRow = __webpack_require__(477);
	
	module.exports = Marionette.Layout.extend({
	    template  : 'ManualImport/Episode/SelectEpisodeLayoutTemplate',
	
	    regions : {
	        episodes : '.x-episodes'
	    },
	
	    events : {
	        'click .x-select' : '_selectEpisodes'
	    },
	
	    columns : [
	        {
	            name       : '',
	            cell       : SelectAllCell,
	            headerCell : 'select-all',
	            sortable   : false
	        },
	        {
	            name  : 'episodeNumber',
	            label : '#',
	            cell  : EpisodeNumberCell
	        },
	        {
	            name           : 'title',
	            label          : 'Title',
	            hideSeriesLink : true,
	            cell           : 'string',
	            sortable       : false
	        },
	        {
	            name  : 'airDateUtc',
	            label : 'Air Date',
	            cell  : RelativeDateCell
	        }
	    ],
	
	    initialize : function(options) {
	        this.series = options.series;
	        this.seasonNumber = options.seasonNumber;
	    },
	
	    onRender : function() {
	        this.episodes.show(new LoadingView());
	
	        this.episodeCollection = new EpisodeCollection({ seriesId : this.series.id });
	        this.episodeCollection.fetch();
	
	        this.listenToOnce(this.episodeCollection, 'sync', function () {
	
	            this.episodeView = new Backgrid.Grid({
	                columns    : this.columns,
	                collection : this.episodeCollection.bySeason(this.seasonNumber),
	                className  : 'table table-hover season-grid',
	                row        : SelectEpisodeRow
	            });
	
	            this.episodes.show(this.episodeView);
	        });
	    },
	
	    _selectEpisodes : function () {
	        var episodes = _.map(this.episodeView.getSelectedModels(), function (episode) {
	            return episode.toJSON();
	        });
	
	        this.trigger('manualimport:selected:episodes', { episodes: episodes });
	        vent.trigger(vent.Commands.CloseModal2Command);
	    }
	});


/***/ },
/* 477 */
/***/ function(module, exports, __webpack_require__) {

	var Backgrid = __webpack_require__(80);
	
	module.exports = Backgrid.Row.extend({
	    className : 'select-episode-row',
	
	    events : {
	        'click' : '_toggle'
	    },
	
	    _toggle : function(e) {
	
	        if (e.target.type === 'checkbox') {
	            return;
	        }
	
	        var checked = this.$el.find('.select-row-cell :checkbox').prop('checked');
	
	        this.model.trigger('backgrid:select', this.model, !checked);
	    }
	});

/***/ },
/* 478 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var QualityCell = __webpack_require__(136);
	var SelectQualityLayout = __webpack_require__(479);
	
	module.exports = QualityCell.extend({
	    className : 'quality-cell editable',
	
	    events : {
	        'click' : '_onClick'
	    },
	
	    _onClick : function () {
	        var view =  new SelectQualityLayout();
	
	        this.listenTo(view, 'manualimport:selected:quality', this._setQuality);
	
	        vent.trigger(vent.Commands.OpenModal2Command, view);
	    },
	
	    _setQuality : function (e) {
	        this.model.set('quality', e.quality);
	    }
	});

/***/ },
/* 479 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	var LoadingView = __webpack_require__(117);
	var ProfileSchemaCollection = __webpack_require__(129);
	var SelectQualityView = __webpack_require__(480);
	
	module.exports = Marionette.Layout.extend({
	    template  : 'ManualImport/Quality/SelectQualityLayoutTemplate',
	
	    regions : {
	        quality : '.x-quality'
	    },
	
	    events : {
	        'click .x-select' : '_selectQuality'
	    },
	
	    initialize : function() {
	        this.profileSchemaCollection = new ProfileSchemaCollection();
	        this.profileSchemaCollection.fetch();
	
	        this.listenTo(this.profileSchemaCollection, 'sync', this._showQuality);
	    },
	
	    onRender : function() {
	        this.quality.show(new LoadingView());
	    },
	
	    _showQuality : function () {
	        var qualities = _.map(this.profileSchemaCollection.first().get('items'), function (quality) {
	            return quality.quality;
	        });
	
	        this.selectQualityView = new SelectQualityView({ qualities: qualities });
	        this.quality.show(this.selectQualityView);
	    },
	
	    _selectQuality : function () {
	        this.trigger('manualimport:selected:quality', { quality: this.selectQualityView.selectedQuality() });
	        vent.trigger(vent.Commands.CloseModal2Command);
	    }
	});

/***/ },
/* 480 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(8);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template  : 'ManualImport/Quality/SelectQualityViewTemplate',
	
	    ui : {
	        select : '.x-select-quality',
	        proper : 'x-proper'
	    },
	
	    initialize : function(options) {
	        this.qualities = options.qualities;
	
	        this.templateHelpers = {
	            qualities: this.qualities
	        };
	    },
	
	    selectedQuality : function () {
	        var selected = parseInt(this.ui.select.val(), 10);
	        var proper = this.ui.proper.prop('checked');
	
	        var quality = _.find(this.qualities, function(q) {
	            return q.id === selected;
	        });
	
	
	        return {
	            quality  : quality,
	            revision : {
	                version : proper ? 2 : 1,
	                real    : 0
	            }
	        };
	    }
	});

/***/ },
/* 481 */
/***/ function(module, exports, __webpack_require__) {

	var PageableCollection = __webpack_require__(29);
	var ManualImportModel = __webpack_require__(482);
	var AsSortedCollection = __webpack_require__(34);
	
	var Collection = PageableCollection.extend({
	    model : ManualImportModel,
	    url   : window.NzbDrone.ApiRoot + '/manualimport',
	
	    state : {
	        sortKey  : 'quality',
	        order    : 1,
	        pageSize : 100000
	    },
	
	    mode : 'client',
	
	    originalFetch : PageableCollection.prototype.fetch,
	
	    initialize : function (options) {
	        options = options || {};
	
	        if (!options.folder && !options.downloadId) {
	            throw 'folder or downloadId is required';
	        }
	
	        this.folder = options.folder;
	        this.downloadId = options.downloadId;
	    },
	
	    fetch : function(options) {
	        options = options || {};
	
	        options.data = { folder : this.folder, downloadId : this.downloadId };
	
	        return this.originalFetch.call(this, options);
	    },
	
	    sortMappings : {
	        series : {
	            sortValue : function(model, attr, order) {
	                var series = model.get(attr);
	
	                if (series) {
	                    return series.sortTitle;
	                }
	
	                return '';
	            }
	        },
	
	        quality : {
	            sortKey : 'qualityWeight'
	        }
	    },
	
	    comparator : function(model1, model2) {
	        var quality1 = model1.get('quality');
	        var quality2 = model2.get('quality');
	
	        if (quality1 < quality2) {
	            return 1;
	        }
	
	        if (quality1 > quality2) {
	            return -1;
	        }
	
	        return 0;
	    }
	});
	
	Collection = AsSortedCollection.call(Collection);
	
	module.exports = Collection;

/***/ },
/* 482 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__(6);
	
	module.exports = Backbone.Model.extend({
	});

/***/ },
/* 483 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var AppLayout = __webpack_require__(70);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.AppRouter.extend({
	    initialize : function() {
	        vent.on(vent.Commands.OpenControlPanelCommand, this._openControlPanel, this);
	        vent.on(vent.Commands.CloseControlPanelCommand, this._closeControlPanel, this);
	    },
	
	    _openControlPanel : function(view) {
	        AppLayout.controlPanelRegion.show(view);
	    },
	
	    _closeControlPanel : function() {
	        AppLayout.controlPanelRegion.closePanel();
	    }
	});

/***/ },
/* 484 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	__webpack_require__(73);
	
	var Tooltip = $.fn.tooltip.Constructor;
	
	var origGetOptions = Tooltip.prototype.getOptions;
	Tooltip.prototype.getOptions = function(options) {
	    var result = origGetOptions.call(this, options);
	
	    if (result.container === false) {
	
	        var container = this.$element.closest('.btn-group,.input-group').parent();
	
	        if (container.length) {
	            result.container = container;
	        }
	    }
	
	    return result;
	};
	
	var onElementRemoved = function(event) {
	    event.data.hide();
	};
	
	var origShow = Tooltip.prototype.show;
	Tooltip.prototype.show = function() {
	    origShow.call(this);
	
	    this.$element.on('remove', this, onElementRemoved);
	};
	
	var origHide = Tooltip.prototype.hide;
	Tooltip.prototype.hide = function() {
	    origHide.call(this);
	
	    this.$element.off('remove', onElementRemoved);
	};
	
	module.exports = {
	    appInitializer : function() {
	
	        $('body').tooltip({ selector : '[title]' });
	
	        return this;
	    }
	};

/***/ },
/* 485 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	var UiSettingsModel = __webpack_require__(22);
	
	var Controller = {
	
	    appInitializer : function() {
	
	        UiSettingsModel.on('sync', this._updateUiSettings);
	
	        this._updateUiSettings();
	    },
	
	    _updateUiSettings: function() {
	
	        if (UiSettingsModel.get('enableColorImpairedMode')) {
	            $('body').addClass('color-impaired-mode');
	        } else {
	            $('body').removeClass('color-impaired-mode');
	        }
	    }
	};
	
	_.bindAll(Controller, 'appInitializer');
	
	module.exports = Controller;

/***/ },
/* 486 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var _ = __webpack_require__(8);
	
	$(document).ready(function() {
	    var _window = $(window);
	    var _scrollContainer = $('#scroll-up');
	    var _scrollButton = $('#scroll-up i');
	
	    var _scrollHandler = function() {
	        if (_window.scrollTop() > 400) {
	            _scrollContainer.fadeIn();
	        } else {
	            _scrollContainer.fadeOut();
	        }
	    };
	
	    $(window).scroll(_.throttle(_scrollHandler, 500));
	    _scrollButton.click(function() {
	        $('html, body').animate({ scrollTop : 0 }, 600);
	        return false;
	    });
	});
	


/***/ },
/* 487 */
/***/ function(module, exports) {

	window.onbeforeunload = function() {
	    window.NzbDrone.unloading = true;
	};

/***/ },
/* 488 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	var HotkeysView = __webpack_require__(489);
	
	$(document).on('keypress', function(e) {
	    if ($(e.target).is('input') || $(e.target).is('textarea')) {
	        return;
	    }
	
	    if (e.charCode === 63) {
	        vent.trigger(vent.Commands.OpenModalCommand, new HotkeysView());
	    }
	});
	
	$(document).on('keydown', function(e) {
	    if (e.ctrlKey && e.keyCode === 83) {
	        vent.trigger(vent.Hotkeys.SaveSettings);
	        e.preventDefault();
	        return;
	    }
	
	    if ($(e.target).is('input') || $(e.target).is('textarea')) {
	        return;
	    }
	
	    if (e.ctrlKey || e.metaKey || e.altKey) {
	        return;
	    }
	
	    if (e.keyCode === 84) {
	        vent.trigger(vent.Hotkeys.NavbarSearch);
	        e.preventDefault();
	    }
	});


/***/ },
/* 489 */
/***/ function(module, exports, __webpack_require__) {

	var vent = __webpack_require__(36);
	var Marionette = __webpack_require__(11);
	
	module.exports = Marionette.ItemView.extend({
	    template : 'Hotkeys/HotkeysViewTemplate'
	});

/***/ },
/* 490 */
/***/ function(module, exports) {

	'use strict';
	
	if(window.NzbDrone.Analytics) {
	    var d = document;
	    var g = d.createElement('script');
	    var s = d.getElementsByTagName('script')[0];
	    g.type = 'text/javascript';
	    g.async = true;
	    g.defer = true;
	    g.src = '//piwik.sonarr.tv/piwik.js';
	    s.parentNode.insertBefore(g, s);
	}


/***/ },
/* 491 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(1);
	var vent = __webpack_require__(36);
	
	$(document).ajaxSuccess(function(event, xhr) {
	    var version = xhr.getResponseHeader('X-ApplicationVersion');
	    if (!version || !window.NzbDrone || !window.NzbDrone.Version) {
	        return;
	    }
	
	    if (version !== window.NzbDrone.Version) {
	        vent.trigger(vent.Events.ServerUpdated);
	    }
	});


/***/ }
]);
//# sourceMappingURL=main.map