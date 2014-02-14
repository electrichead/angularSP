angular.module(
	"SPSEndpointHelper",
	[]
).run(["$rootScope", function($rootScope) {
	$rootScope.results = {};
}]);

angular.module("SPSEndpointHelper").factory("SPSEndpointHelper", function() {
	return new function() {

		this.setupAccumulatorContainerFn = function(scope, elem, attrs) {
			scope.accumulator = elem[0].tagName;
			scope.results[scope.accumulator] = [];
			return function(scope, iElement, iAttr) {};
		};

		this.accumulatorFn = function(scope, elem, attrs) {
			var attrData = {};
			angular.forEach(attrs, function(val, key) {
				if (key.indexOf('$') !== 0) {
					var newKey = ((key.indexOf("ows") === 0) ? key.substr(3) : key).replace(/X0020/g, ' ');
					attrData[newKey] = val;
				}
			});

			attrData.text = elem.text();
			attrData.tagName = elem[0].tagName;

			scope.results[scope.accumulator].push(attrData);
		};

		this.textAccumulatorFn = function(scope, elem, attrs) {
			var attrData = {};
			
			attrData.text = elem.text();
			attrData.tagName = elem[0].tagName;

			scope.results[scope.accumulator].push(attrData);
		};
	}
});

// ________________________________________________________________________________________________________________________________
// ________________________________________________________________________________________________________________________________ ALERTS

angular.module("SPSEndpoints_alerts", ["SPSEndpointHelper"]);

angular.module("SPSEndpoints_alerts").factory("SPSEndpoints_alerts", function() {
	return new function() {
		this.initSOAPAction = function(scope, elem, attrs) {
			elem.attr("xmlns", [scope.SCHEMASharePoint, "/soap/2002/1/alerts/"].join(''));
			scope.httpHeaders["SOAPAction"] = [scope.SCHEMASharePoint, "/soap/2002/1/alerts/"].join('');
		}
	};
})

/*angular.module("SPSEndpoints_alerts").directive("deleteAlerts", ["SPSEndpoints_alerts", function(SPSEndpoints_alerts) {
	return {
		restrict: 'E',
		template: [
			"<IDs>",
				"<string data-ng-repeat=\"val in opt.Ids\" data-ng-bind=\"val\"["SPSEndpointHelper", ></stringSPSEndpointHelper>",
			"</IDs>"
		].join(''),
		link: SPSEndpoints_alerts.initSOAPAction
	}
}]);]*/


// ________________________________________________________________________________________________________________________________
// ________________________________________________________________________________________________________________________________ AUTH

angular.module("SPSEndpoints_auth", ["SPSEndpointHelper"]);

angular.module("SPSEndpoints_auth").factory("SPSEndpoints_auth", function() {
	return new function() {
		this.initSOAPAction = function(scope, elem, attrs) {
			
		}
	};
});

// ________________________________________________________________________________________________________________________________
// ________________________________________________________________________________________________________________________________ COPY

angular.module("SPSEndpoints_copy", ["SPSEndpointHelper"]);

angular.module("SPSEndpoints_copy").factory("SPSEndpoints_copy", function() {
	return new function() {
		this.initSOAPAction = function(scope, elem, attrs) {
			console.log("copy here//");
		}
	};
});


// ________________________________________________________________________________________________________________________________
// ________________________________________________________________________________________________________________________________ FORM

angular.module("SPSEndpoints_form", ["SPSEndpointHelper"]);

angular.module("SPSEndpoints_form").factory("SPSEndpoints_form", function() {
	return new function() {
		this.initSOAPAction = function(scope, elem, attrs) {
			console.log("form here//");
		}
	};
});


// ________________________________________________________________________________________ getformcollectionresult

angular.module('SPSEndpoints_form').directive('getformcollectionresult', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			pre: SPSEndpointHelper.setupAccumulatorContainerFn
		}
	}
}]);

angular.module('SPSEndpoints_form').directive('form', ["SPSEndpointHelper", "$rootScope", function(SPSEndpointHelper, $rootScope) {
	return {
		restrict: 'E',
		link: {
			post: SPSEndpointHelper.accumulatorFn
		}
	}
}]);

// ________________________________________________________________________________________ GetListItems

angular.module('SPSEndpoints_form').directive('getformitemsresult', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			pre: SPSEndpointHelper.setupAccumulatorContainerFn
		}
	}
}]);

// ________________________________________________________________________________________________________________________________
// ________________________________________________________________________________________________________________________________ LIST

angular.module("SPSEndpoints_list", ["SPSEndpointHelper"]);

angular.module("SPSEndpoints_list").factory("SPSEndpoints_list", function() {
	return new function() {
		this.initSOAPAction = function(scope, elem, attrs) {
			console.log("list here//", elem.parent());
		}
	};
});

// ________________________________________________________________________________________ AddAttachment

angular.module('SPSEndpoints_list').directive('addattachmentresponse', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			pre: SPSEndpointHelper.setupAccumulatorContainerFn
		}
	}
}]);

angular.module('SPSEndpoints_list').directive('addattachmentresult', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: SPSEndpointHelper.textAccumulatorFn
	}
}]);

// ________________________________________________________________________________________ AddDiscussionBoardItem

angular.module('SPSEndpoints_list').directive('adddiscussionboarditemresponse', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			pre: SPSEndpointHelper.setupAccumulatorContainerFn
		}
	}
}]);

angular.module('SPSEndpoints_list').directive('adddiscussionboarditemresult', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: SPSEndpointHelper.textAccumulatorFn
	}
}]);

// ________________________________________________________________________________________ AddList

angular.module('SPSEndpoints_list').directive('addlistresponse', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			pre: SPSEndpointHelper.setupAccumulatorContainerFn
		}
	}
}]);

angular.module('SPSEndpoints_list').directive('addlistresult', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: SPSEndpointHelper.textAccumulatorFn
	}
}]);

// ________________________________________________________________________________________ AddListFromFeature

angular.module('SPSEndpoints_list').directive('addlistfromfeatureresponse', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			pre: SPSEndpointHelper.setupAccumulatorContainerFn
		}
	}
}]);

angular.module('SPSEndpoints_list').directive('addlistfromfeatureresult', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: SPSEndpointHelper.textAccumulatorFn
	}
}]);

// ________________________________________________________________________________________ GetListCollection

angular.module('SPSEndpoints_list').directive('getlistcollectionresult', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			pre: SPSEndpointHelper.setupAccumulatorContainerFn
		}
	}
}]);

angular.module('SPSEndpoints_list').directive('list', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			post: SPSEndpointHelper.accumulatorFn
		}
	}
}]);

// ________________________________________________________________________________________ GetListItems

angular.module('SPSEndpoints_list').directive('getlistitemsresult', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: {
			pre: SPSEndpointHelper.setupAccumulatorContainerFn
		}
	}
}]);
// ________________________________________________________________________________________________________________________________
// ________________________________________________________________________________________________________________________________ Shared


angular.module('SPSEndpoints_list').directive('zRow', ["SPSEndpointHelper", function(SPSEndpointHelper) {
	return {
		restrict: 'E',
		link: SPSEndpointHelper.accumulatorFn
	}
}]);



// ________________________________________________________________________________________________________________________________
// ________________________________________________________________________________________________________________________________ 


angular.module(
	"AngularSPReceiver",
	[
		"SPSEndpoints_alerts",
		"SPSEndpoints_auth",
		"SPSEndpoints_copy",
		"SPSEndpoints_form",
		"SPSEndpoints_list"
	]
);

angular.module("AngularSPReceiver").factory("AngularSPReceiver", function() {
	return new function() {
		this.convertFromCamelCase = function(str) {
			return str.replace(/([A-Z])/g, function(toReplace, capture, index) {
				return [(index > 0) ? "-" : "-", toReplace.toLowerCase()].join('');
			})
		};

		this.convertToCamelCase = function(str) {
			return [str.charAt(0).toUpperCase(), str.substring(1).replace(/\-([a-z])/g, function(toReplace, capture, index) {
				return capture.toUpperCase();
			})].join('')
		};
	}
});
