/* global app:true */

(function() {
    'use strict';

    app = app || {};

    app.Device = Backbone.Model.extend({
        idAttribute: '_id',
        url: function() {
            return baseUrl + '/admin/devices/' + this.id + '/';
        }
    });

    app.Delete = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: {
            success: false,
            errors: [],
            errfor: {}
        },
        url: function() {
            return baseUrl + '/admin/devices/' + app.mainView.model.id + '/';
        }
    });

    app.Details = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: {
            success: false,
            errors: [],
            errfor: {},
            email: '',
            hash: ''
        },
        url: function() {
            return baseUrl + '/admin/devices/' + app.mainView.model.id + '/';
        },
        parse: function(response) {
            if (response.device) {
                app.mainView.model.set(response.device);
                delete response.device;
            }

            return response;
        }
    });

    app.HeaderView = Backbone.View.extend({
        el: '#header',
        template: _.template($('#tmpl-header').html()),
        initialize: function() {
            this.model = app.mainView.model;
            this.listenTo(this.model, 'change', this.render);
            this.render();
        },
        render: function() {
            this.$el.html(this.template(this.model.attributes));
        }
    });

    app.DetailsView = Backbone.View.extend({
        el: '#details',
        template: _.template($('#tmpl-details').html()),
        events: {
            'click .btn-update': 'update'
        },
        initialize: function() {
            this.model = new app.Details();
            this.syncUp();
            this.listenTo(app.mainView.model, 'change', this.syncUp);
            this.listenTo(this.model, 'sync', this.render);
            this.render();
        },
        syncUp: function() {
            this.model.set({
                _id: app.mainView.model.id,
                email: app.mainView.model.get('email'),
                hash: app.mainView.model.get('hash')
            });
        },
        render: function() {
            this.$el.html(this.template(this.model.attributes));

            for (var key in this.model.attributes) {
                if (this.model.attributes.hasOwnProperty(key)) {
                    this.$el.find('[name="' + key + '"]').val(this.model.attributes[key]);
                }
            }
        },
        update: function() {
            this.model.save({
                email: this.$el.find('[name="email"]').val(),
                hash: this.$el.find('[name="hash"]').val()
            });
        }
    });

    app.DeleteView = Backbone.View.extend({
        el: '#delete',
        template: _.template($('#tmpl-delete').html()),
        events: {
            'click .btn-delete': 'delete',
        },
        initialize: function() {
            this.model = new app.Delete({ _id: app.mainView.model.id });
            this.listenTo(this.model, 'sync', this.render);
            this.render();
        },
        render: function() {
            this.$el.html(this.template(this.model.attributes));
        },
        delete: function() {
            if (confirm('Are you sure?')) {
                this.model.destroy({
                    success: function(model, response) {
                        if (response.success) {
                            location.href = baseUrl + '/admin/devices/';
                        } else {
                            app.deleteView.model.set(response);
                        }
                    }
                });
            }
        }
    });

    app.MainView = Backbone.View.extend({
        el: '.page .container',
        initialize: function() {
            app.mainView = this;
            this.model = new app.Device(JSON.parse(unescape($('#data-record').html())));

            app.headerView = new app.HeaderView();
            app.detailsView = new app.DetailsView();
            app.deleteView = new app.DeleteView();
        }
    });

    $(document).ready(function() {
        app.mainView = new app.MainView();
    });
}());
