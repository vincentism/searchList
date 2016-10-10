define(function (require, exports, module){

    function SearchList(options){
        var self = this;

        this.param = options.data || {};
        this.preventQuery = false;
        this.autoQuery = options.autoQuery;

        this.wrapper = $('#' + options.wrapper);
        this.searchValue = this.wrapper.find('.search-value');
        this.searchText = this.wrapper.find('.search-text');
        this.searchBar = new SearchBar({
            wrapper: self.wrapper,
            input: self.wrapper.find('.' + options.inputClass),
            clear: self.wrapper.find('.' + options.clearClass),
            submit: self.wrapper.find('.' + options.submitClass),
            onclear: function(){
                if(self.autoQuery && !self.preventQuery && self.grid.wrapper.css('display') !== 'none'){
                    self.param.keyword = '';
                    self.pagin.reset({
                        data: self.param
                    });
                    self.grid.init();
                    self.pagin.request();
                }else{
                    self.grid.hide();
                }

                options.onclear && options.onclear.apply(this, arguments);
            },
            onchange: function(val){
                if(!self.preventQuery){
                    self.param.keyword = val;
                    self.pagin.reset({
                        data: self.param
                    });
                    self.grid.init();
                    self.pagin.request();
                }

                options.onchange && options.onchange.apply(this, arguments);
            },
            onfocus: function(val){
                if(self.grid.list && self.grid.list.children().length > 1){
                    self.grid.show();
                }else if(self.autoQuery){
                    self.param.keyword = val;
                    self.pagin.reset({
                        data: self.param
                    });
                    self.grid.init();
                    self.pagin.request();
                }

                options.onfocus && options.onfocus.apply(this, arguments);
            },
            onblur: function(val){
                if(val){
                    if(self.searchValue.val()){
                        self.preventQuery = true;
                        self.searchBar.value = '';
                        self.searchBar.input.val('');
                        self.preventQuery = false;
                    }else{
                        var ele = findItem(val);
                        ele && self.setValue(ele.name, ele.id);
                    }
                }

                options.onblur && options.onblur.apply(this, arguments);
            }
        });
        this.searchBar.lookup = self;
        this.placeholder = this.searchBar.input.attr('placeholder');

        function findItem(val){
            if(!self.grid.list) return null;

            var eles = self.grid.list.children(),
                len = eles.length,
                i = 0, ele;

            while(len > i){
                ele = eles.eq(i);
                if(ele.text() === val){
                    return {
                        name: val,
                        id: ele.data('id')
                    }
                }
                i ++;
            }

            return null;
        }

        this.grid = new List({
            wrapper: self.wrapper.find('.search-list'),
            render: options.render || function(data){
                return '<li data-id="'+ data.id +'">'+ data.name +'</li>';
            },
            onscrollbottom: function(e){
                self.pagin.request();
            },
            onclickrow: function(e){
                var $ele = $(this),
                    name = $ele.text(),
                    id = $ele.data('id');

                self.setValue(name, id);
                options.onclickrow && options.cnclickrow.call(this, e);
                self.grid.hide();
            }
        });
        this.grid.lookup = self;
        this.setValue = function(name, id){
            self.preventQuery = true;
            self.searchBar.value = '';
            self.searchBar.input.val('');
            self.searchBar.input.attr('placeholder', '');
            self.searchBar.clear.css('display', 'none');
            self.searchValue.val(id);
            self.searchValue.next().val(name);
            self.searchText.text(name);
            self.searchText.next().css('display', 'inline-block');
            self.searchText.parent().css('display', 'inline-block');
            setTimeout(function(){
                self.preventQuery = false;
            }, 1000);
        }

        var flag = true;
        this.wrapper.on('click', function(e){
            flag = false;
        });

        $(document).on('click', function (e) {
            flag && self.grid.hide();
            flag = true;
        });

        this.wrapper.find('.search-text-clear').on('click', function (e) {
            self.searchValue.val('');
            self.searchValue.next().val('');
            self.searchText.text('');
            $(this).parent().css('display', 'none');
            self.searchBar.input.attr('placeholder', self.placeholder);
        });

        this.wrapper.find('.search-bar').on('click', function(e){
            if(e.target === this)
                self.searchBar.input.focus();
        });

        this.pagin = initPagin({
            url: options.url,
            pageSize: 10,
            getParam: options.getParam,
            success: function(data, page, totalPage){
                if(!data.length)
                    return self.grid.state(page === 1 ? '没有找到任何数据' : '获取数据失败');

                if(page === 1 && (!self.grid.desc || self.grid.desc.prev().length)){
                    self.grid.init();
                }

                self.grid.append(data);
                if(page >= totalPage)
                    self.grid.state('没有更多数据了');
            },
            error: function(err){
                err !== 'abort' && self.grid.state('获取数据失败');
            }
        });
        this.pagin.lookup = self;
    }

    module.exports = function(options){
        return new SearchList(options);
    }

    function SearchBar(options){
        this.wrapper = typeof(options.wrapper) === 'string' ?
            $(options.wrapper) : options.wrapper;

        this.input = options.input || this.wrapper.find('.searchBar-input');
        this.clear = options.clear || this.wrapper.find('.searchBar-clear');
        this.submit = options.submit || this.wrapper.find('.searchBar-submit');
        this.value = '';

        return this.init(options);
    }

    SearchBar.prototype.init = function(options){
        var self = this,
            flag = false,
            timeStamp = null,
            submitStamp = null,
            onchange = function(e){
                if(flag) return;

                e.preventDefault();
                e.stopPropagation();

                var val = self.input.val().replace(/^\s+/, '').replace(/\s+$/, '');
                if(val === self.lookup.placeholder || val == self.value)
                    return;

                self.value = val;
                if(val){
                    self.clear && self.clear.css('display', 'block');
                    if(options.onchange){
                        timeStamp && clearTimeout(timeStamp);
                        timeStamp = setTimeout(function(){
                            options.onchange.call(self, val, e);
                        }, 300);
                    }
                }else{
                    timeStamp && clearTimeout(timeStamp);
                    self.clear && self.clear.css('display', 'none');
                    options.onclear && options.onclear.call(self, val, e);
                }
            };

        if(!self.input) return self;
        self.input.off('input').on('input', onchange);
        self.input.off('propertychange').on('propertychange', onchange);
        self.input.off('compositionstart').on('compositionstart', function(e){ flag = true; });
        self.input.off('compositionend').on('compositionend', function(e){ flag = false; });

        self.clear && self.clear.off('click').on('click', function(e){
            this.style.display = 'none';
            self.input.val('');
            self.value = '';
            options.onclear && options.onclear.call(self, e);
        });

        self.submit && self.submit.off('click').on('click', function(e){
            if(!options.onsubmit) return;
            var val = self.value;
            submitStamp && clearTimeout(submitStamp);
            submitStamp = setTimeout(function(){
                options.onsubmit.call(self, val, e);
            }, 300);
        });

        self.input.off('keydown').off('keyup');
        options.onsubmit && self.input.on('keyup' , function(e){
            var event = e || window.event,
                code = event.keyCode || event.which || event.charCode,
                val;

            if(code !== 13) return;
            val = self.value;
            options.onsubmit.call(self, val, e);
            self.input.blur();

            e.stopPropagation();
            e.preventDefault();
        });

        var isFocusReady = null;
        options.onfocus && self.input.on('focus', function(e){
            isFocusReady && clearTimeout(isFocusReady);
            isFocusReady = setTimeout(function(){
                options.onfocus.call(this, self.value, e);
            }, 300);
        });

        var isBlurReady = null;
        options.onblur && self.input.on('blur', function(e){
            isBlurReady && clearTimeout(isBlurReady);
            isBlurReady = setTimeout(function(){
                options.onblur.call(this, self.value, e);
            }, 300);
        });
        return self;
    };

    // 展示列表
    function List(options){
        this.wrapper = options.wrapper;
        this.render = options.render;

        function onmousewheel(e){
            var event = e.originalEvent;

            event.delta = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
            this.scrollTop -= event.delta * 100;

            e.preventDefault();
            e.stopPropagation();
        }

        this.wrapper.on('mousewheel', onmousewheel);
        this.wrapper.on('DOMMouseScroll', onmousewheel);
        this.wrapper.on('scroll', function (e) {
            if(this.scrollTop < 10 && options.onscrolltop)
                options.onscrolltop.call(this, e);

            if(this.scrollTop + this.clientHeight > this.scrollHeight - 60 && options.onscrollbottom)
                options.onscrollbottom.call(this, e);
        });
        this.wrapper.on('click', 'li', function(e){
            if($(this).hasClass('list-desc'))
                return;

            options.onclickrow.call(this, e);
        });
    }

    List.prototype.init = function(text){
        this.wrapper.html('<ul><li class="list-desc">'+ (text || '数据查询中...') +'</li></ul>');
        this.list = this.wrapper.children();
        this.desc = this.list.children('.list-desc');
        return this.show();
    };

    List.prototype.append = function(data){
        var render = this.render;

        this.desc.before($.map(data, function(val){
            return render(val);
        }).join(''));
        return this;
    };

    List.prototype.state = function(text){
        this.desc.text(text);
        return this;
    };

    List.prototype.show = function(){
        this.wrapper.css('display', 'block');
        return this;
    }

    List.prototype.hide = function(){
        this.wrapper.css('display', 'none');
        return this;
    };

    // 分页设置
    function initPagin(options){
        var data = options.data || {},
            url = options.url,
            success = options.success || null,
            error = options.error || null,
            pageSize = options.pageSize || 20,
            type = options.type || 'get',
            getParam = options.getParam,
            totalPage = 0,
            page = 1,
            loading = false,
            ajaxProxy = null;

        return {
            request: function(){
                if(loading || totalPage && totalPage < page)
                    return false;

                if(getParam && getParam.call(this.lookup, data) === false)
                    return false;

                loading = true;
                ajaxProxy && ajaxProxy.abort();
                ajaxProxy = $.ajax({
                    url: url,
                    data: $.extend(data, { page: page, pageSize: pageSize }),
                    type: type,
                    success: function(res){
                        loading = false;
                        if(res && res.status){
                            var data = res.data || {};

                            if(data.length){
                                totalPage = 1;
                                return success && success(data, page ++, totalPage, data.length);
                            }
                            if(data.total && data.items){
                                totalPage = Math.ceil(data.total / pageSize) || 1;
                                return success && success(data.items, page ++, totalPage, data.total);
                            }
                            totalPage = 1;
                            return success && success([], page ++, totalPage, 0);
                        }else{
                            totalPage = 1;
                            success && success([], page ++, totalPage, 0);
                        }
                    },
                    error: function(res, status, err){
                        totalPage = 1;
                        error && error(err, page);
                    }
                });
                return true;
            },
            reset: function(options){
                data = options.data || data;
                url = options.url || url;
                success = options.success || success;
                error = options.error || error;
                pageSize = options.pageSize || pageSize;
                type = options.type || type;
                getParam = options.getParam || getParam;
                totalPage = 0;
                page = 1;
                loading = false;
            },
            getPage: function(){
                return page;
            }
        }
    }
});
