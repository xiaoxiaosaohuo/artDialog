/* global require,module */

'use strict';

var angular = require('angular');
var Popup = require('../lib/popup');
var namespace = angular.module('artDialog', []);


function directive(name, options) {
    namespace.directive(name, ['$parse', function($parse) {

        var directive = {
            template: options.template,
            restrict: 'AE',
            transclude: true,
            replace: true,
            scope: {

                'ngIf': '=',
                'ngShow': '=',
                'ngHide': '=',

                'close': '&',

                // 吸附到指定 ID 元素
                'for': '@',

                // 对齐方式，配合 for
                'align': '@',

                // 是否固定定位（跟随滚动条）
                'fixed': '@',

                // 是否是模态浮层
                'modal': '@'

            },
            controller: ['$scope', '$element', '$attrs',
                function($scope, $element, $attrs) {
                    this.$close = function() {
                        $scope.close();
                    };
                }
            ],
            link: function(scope, elem, attrs, superheroCtrl) {

                var $ = angular.element;
                var popup = new Popup(elem[0]);

                var type = {
                    'for': 'String@id',
                    'align': 'String',
                    'fixed': 'Boolean',
                    'modal': 'Boolean'
                };

                var scapegoat = {
                    'for': 'anchor'
                };


                var parse = {
                    'String@id': function(value) {
                        return document.getElementById(value || '');
                    },

                    'Boolean': function(value) {
                        return $parse(value)();
                    }
                };



                Object.keys(type).forEach(function(key) {
                    if (attrs[key]) scope.$watch(key, function(value) {
                        var name = key;

                        if (scapegoat[name]) {
                            name = scapegoat[name];
                        }

                        if (type[key]) {
                            value = parse[type[key]](value);
                        }

                        popup[name] = value;
                        scope[name] = value;
                        popup.reset();
                    });
                });


                // 通过模型控制对话框显示与隐藏

                if (attrs.ngIf) scope.$watch('ngIf', toggle);
                if (attrs.ngShow) scope.$watch('ngShow', toggle);
                if (attrs.ngHide) scope.$watch('ngHide', toggle);


                function toggle(v) {

                    if (typeof v === 'undefined') {
                        return;
                    }

                    var value = true;

                    switch (attrs) {
                        case 'ngIf':
                            value = scope.ngIf;
                            break;
                        case 'ngShow':
                            value = scope.ngShow;
                            break;
                        case 'ngHide':
                            value = !scope.ngHide;
                            break;
                    }

                    var showType = scope.modal ? 'showModal' : 'show';

                    if (value) {
                        popup[showType](scope.anchor);
                    } else /*if (!attrs.ngIf)*/ {
                        popup.close();
                    }

                }



                // ESC 快捷键关闭浮层
                function esc(event) {

                    var target = event.target;
                    var nodeName = target.nodeName;
                    var rinput = /^input|textarea$/i;
                    var isBlur = Popup.current === popup;
                    var isInput = rinput.test(nodeName) && target.type !== 'button';
                    var keyCode = event.keyCode;

                    // 避免输入状态中 ESC 误操作关闭
                    if (!isBlur || isInput) {
                        return;
                    }

                    if (keyCode === 27) {
                        superheroCtrl.$close();
                        scope.$apply();
                    }
                }


                $(document).on('keydown', esc);


                (options.link || function() {}).apply(this, arguments);


                // ng 销毁事件控制对话框关闭
                // 控制器销毁或者 ng-if="false" 都可能触发此
                // scope.$on('$destroy', callback) >> 这种方式对 ngAnimate 支持不好
                elem.one('$destroy', function() {
                    $(document).off('keydown', esc);
                    popup.close().remove();
                });



            }
        };


        angular.extend(directive.scope, options.scope);


        return directive;
    }]);

    var child = {
        childDirective: function(subName, subOptions) {
            namespace.directive(subName, function() {
                return {
                    require: '^' + name,
                    restrict: 'AE',
                    transclude: true,
                    replace: true,
                    template: subOptions.template
                };
            });

            return child;
        }
    };

    return child;
}

directive.module = namespace;

module.exports = directive;