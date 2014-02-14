angular.module("AngularSPHelper", []).factory(
    "AngularSPHelper",
    function() {
        return new function() {
            this.comb = {
                getlistitems: ["GetListItemsResponse","GetListItemsResult","listitems","rs:data","z:row"]
            }
        }
    }
);

angular.module("AngularSP", ["AngularSPHelper"]).factory(
    'AngularSP',
    [
        '$http',
        '$compile',
        '$rootScope',
        '$timeout',
        "AngularSPHelper",
        function(
            $http,
            $compile,
            $rootScope,
            $timeout,
            AngularSPHelper
        ) {
            // Begin SPServices code http://spservices.codeplex.com/ (minor modifications)
            var SLASH                   = "/",
                TXTColumnNotFound       = "Column not found on page",
                SCHEMASharePoint        = "http://schemas.microsoft.com/sharepoint",
                ALERTS                  = "Alerts",
                AUTHENTICATION          = "Authentication",
                COPY                    = "Copy",
                FORMS                   = "Forms",
                LISTS                   = "Lists",
                MEETINGS                = "Meetings",
                PEOPLE                  = "People",
                PERMISSIONS             = "Permissions",
                PUBLISHEDLINKSSERVICE   = "PublishedLinksService",
                SEARCH                  = "Search",
                SPSEARCH                = "SPSearch",
                SHAREPOINTDIAGNOSTICS   = "SharePointDiagnostics",
                SITEDATA                = "SiteData",
                SITES                   = "Sites",
                SOCIALDATASERVICE       = "SocialDataService",
                SPELLCHECK              = "SpellCheck",
                TAXONOMYSERVICE         = "TaxonomyClientService",
                USERGROUP               = "usergroup",
                USERPROFILESERVICE      = "UserProfileService",
                VERSIONS                = "Versions",
                VIEWS                   = "Views",
                WEBPARTPAGES            = "WebPartPages",
                WEBS                    = "Webs",
                WORKFLOW                = "Workflow",
                SPServicesContext = new function() {
                    // SharePoint 2010 gives us a context variable
                    if(typeof _spPageContextInfo !== "undefined") {
                        this.thisSite = _spPageContextInfo.webServerRelativeUrl;
                        this.thisList = _spPageContextInfo.pageListId;
                        this.thisUserId = _spPageContextInfo.userId;
                    // In SharePoint 2007, we know the site and UserId
                    } else {
                        this.thisSite = (typeof L_Menu_BaseUrl !== "undefined") ? L_Menu_BaseUrl : "";
                        this.thisList = "";
                        this.thisUserId = (typeof _spUserId !== "undefined") ? _spUserId : undefined;
                    }
                },
                i = 0,
                encodeOptionList = ["listName", "description"]
                WSops = [],
                defaults = {
                    cacheXML: false,            // If true, we'll cache the XML results for the call
                    operation: "",              // The Web Service operation
                    webURL: "",                 // URL of the target Web
                    endPoint: "_vti_bin/",      // Might be overridden
                    makeViewDefault: false,     // true to make the view the default view for the list

                    // For operations requiring CAML, these options will override any abstractions
                    CAMLViewName: "",           // View name in CAML format.
                    CAMLQuery: "",              // Query in CAML format
                    CAMLViewFields: "",         // View fields in CAML format
                    CAMLRowLimit: 0,            // Row limit as a string representation of an integer
                    CAMLQueryOptions: "<QueryOptions></QueryOptions>",      // Query options in CAML format

                    // Abstractions for CAML syntax
                    batchCmd: "Update",         // Method Cmd for UpdateListItems
                    valuepairs: [],             // Fieldname / Fieldvalue pairs for UpdateListItems

                    // As of v0.7.1, removed all options which were assigned an empty string ("")
                    DestinationUrls: [],        // Array of destination URLs for copy operations
                    behavior: "Version3",       // An SPWebServiceBehavior indicating whether the client supports Windows SharePoint Services 2.0 or Windows SharePoint Services 3.0: {Version2 | Version3 }
                    storage: "Shared",          // A Storage value indicating how the Web Part is stored: {None | Personal | Shared}
                    objectType: "List",         // objectType for operations which require it
                    cancelMeeting: true,        // true to delete a meeting;false to remove its association with a Meeting Workspace site
                    nonGregorian: false,        // true if the calendar is set to a format other than Gregorian;otherwise, false.
                    fClaim: false,              // Specifies if the action is a claim or a release. Specifies true for a claim and false for a release.
                    recurrenceId: 0,            // The recurrence ID for the meeting that needs its association removed. This parameter can be set to 0 for single-instance meetings.
                    sequence: 0,                // An integer that is used to determine the ordering of updates in case they arrive out of sequence. Updates with a lower-than-current sequence are discarded. If the sequence is equal to the current sequence, the latest update are applied.
                    maximumItemsToReturn: 0,    // SocialDataService maximumItemsToReturn
                    startIndex: 0,              // SocialDataService startIndex
                    isHighPriority: false,      // SocialDataService isHighPriority
                    isPrivate: false,           // SocialDataService isPrivate
                    rating: 1,                  // SocialDataService rating
                    maxResults: 10,             // Unless otherwise specified, the maximum number of principals that can be returned from a provider is 10.
                    principalType: "User",      // Specifies user scope and other information: [None | User | DistributionList | SecurityGroup | SharePointGroup | All]

                    async: true,                // Allow the user to force async
                    completefunc: null,         // Function to call on completion
                    scope: $rootScope.$new(),   // Might be overridden
                    accumulator: 'angularSP',   // Variable in scope to store the results
                    parseResultsToJson: true    // Parse the results to a JSON object

                },
                SOAPTemplate = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'><soap:Body><payload></payload></soap:Body></soap:Envelope>",
                SOAPEnvelope = {},
                SOAPEnvelope.header = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'><soap:Body>",
                SOAPEnvelope.footer = "</soap:Body></soap:Envelope>",
                SOAPAction = [];

            function errBox(msg) {
                if (console && typeof(console["error"]) == "function") console.error(msg);
            }

            function addToPayload(opt, paramArray) {
                var i;

                for (i=0; i < paramArray.length; i++) {
                    // the parameter name and the option name match
                    if(typeof paramArray[i] === "string") {
                        SOAPEnvelope.payload.push(wrapNode(paramArray[i], opt[paramArray[i]]));
                    // the parameter name and the option name are different 
                    } else if(paramArray[i].length === 2) {
                        SOAPEnvelope.payload.push(wrapNode(paramArray[i][0], opt[paramArray[i][1]]));
                    // something isn't right, so report it
                    } else {
                        errBox(opt.operation, "paramArray[" + i + "]: " + paramArray[i], "Invalid paramArray element passed to addToPayload()");
                    }
                }
            } // End of function addToPayload;

            function wrapNode(n, v) {
                var thisValue = typeof v !== "undefined" ? v : "";
                return ["<", n, ">", thisValue, "</", n, ">"].join('');
            }

            function SPGetCurrentSite(opt) {

                // We've already determined the current site...
                if(SPServicesContext.thisSite.length > 0) {
                    return SPServicesContext.thisSite;
                }

                // TODO: Convert this, cache it

                // If we still don't know the current site, we call WebUrlFromPageUrlResult.
                var msg = [SOAPEnvelope.header,
                        "<WebUrlFromPageUrl xmlns='", SCHEMASharePoint, "/soap/' ><pageUrl>", location.protocol, "//", location.host, location.pathname, "</pageUrl></WebUrlFromPageUrl>",
                        SOAPEnvelope.footer].join('');
                $.ajax({
                    async: false, // Need this to be synchronous so we're assured of a valid value
                    url: ["/", opt.endPoint, "Webs.asmx"].join(''),
                    type: "POST",
                    data: msg,
                    dataType: "xml",
                    contentType: "text/xml;charset=\"utf-8\"",
                    complete: function (xData) {
                        SPServicesContext.thisSite = $(xData.responseXML).find("WebUrlFromPageUrlResult").text();
                    }
                });

                return SPServicesContext.thisSite; // Return the URL

            }

            var xml_special_to_escaped_one_map = {
                '&': '&amp;',
                '"': '&quot;',
                '<': '&lt;',
                '>': '&gt;'};
            var escaped_one_to_xml_special_map = {
                '&amp;': '&',
                '&quot;': '"',
                '&lt;': '<',
                '&gt;': '>'};
            
            function encodeXml(string) {
                return string.replace(/([\&"<>])/g, function(str, item) {
                    return xml_special_to_escaped_one_map[item];
                });
            }
            function decodeXml(string) {
                return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g,
                    function(str, item) {
                        return escaped_one_to_xml_special_map[item];
                });
            }

            WSops.GetAlerts                                 = [ALERTS, false];
            WSops.DeleteAlerts                              = [ALERTS, true];

            WSops.Mode                                      = [AUTHENTICATION, false];
            WSops.Login                                     = [AUTHENTICATION, false];

            WSops.CopyIntoItems                             = [COPY, true];
            WSops.CopyIntoItemsLocal                        = [COPY, true];
            WSops.GetItem                                   = [COPY, false];

            WSops.GetForm                                   = [FORMS, false];
            WSops.GetFormCollection                         = [FORMS, false];

            WSops.AddAttachment                             = [LISTS, true];
            WSops.AddDiscussionBoardItem                    = [LISTS, true];
            WSops.AddList                                   = [LISTS, true];
            WSops.AddListFromFeature                        = [LISTS, true];
            WSops.ApplyContentTypeToList                    = [LISTS, true];
            WSops.CheckInFile                               = [LISTS, true];
            WSops.CheckOutFile                              = [LISTS, true];
            WSops.CreateContentType                         = [LISTS, true];
            WSops.DeleteAttachment                          = [LISTS, true];
            WSops.DeleteContentType                         = [LISTS, true];
            WSops.DeleteContentTypeXmlDocument              = [LISTS, true];
            WSops.DeleteList                                = [LISTS, true];
            WSops.GetAttachmentCollection                   = [LISTS, false];
            WSops.GetList                                   = [LISTS, false];
            WSops.GetListAndView                            = [LISTS, false];
            WSops.GetListCollection                         = [LISTS, false];
            WSops.GetListContentType                        = [LISTS, false];
            WSops.GetListContentTypes                       = [LISTS, false];
            WSops.GetListItemChanges                        = [LISTS, false];
            WSops.GetListItemChangesSinceToken              = [LISTS, false];
            WSops.GetListItems                              = [LISTS, false];
            WSops.GetVersionCollection                      = [LISTS, false];
            WSops.UndoCheckOut                              = [LISTS, true];
            WSops.UpdateContentType                         = [LISTS, true];
            WSops.UpdateContentTypesXmlDocument             = [LISTS, true];
            WSops.UpdateContentTypeXmlDocument              = [LISTS, true];
            WSops.UpdateList                                = [LISTS, true];
            WSops.UpdateListItems                           = [LISTS, true];

            WSops.AddMeeting                                = [MEETINGS, true];
            WSops.CreateWorkspace                           = [MEETINGS, true];
            WSops.RemoveMeeting                             = [MEETINGS, true];
            WSops.SetWorkSpaceTitle                         = [MEETINGS, true];

            WSops.ResolvePrincipals                         = [PEOPLE, true];
            WSops.SearchPrincipals                          = [PEOPLE, false];

            WSops.AddPermission                             = [PERMISSIONS, true];
            WSops.AddPermissionCollection                   = [PERMISSIONS, true];
            WSops.GetPermissionCollection                   = [PERMISSIONS, true];
            WSops.RemovePermission                          = [PERMISSIONS, true];
            WSops.RemovePermissionCollection                = [PERMISSIONS, true];
            WSops.UpdatePermission                          = [PERMISSIONS, true];

            WSops.GetLinks                                  = [PUBLISHEDLINKSSERVICE, true];

            WSops.GetPortalSearchInfo                       = [SEARCH, false];
            WSops.GetQuerySuggestions                       = [SEARCH, false];
            WSops.GetSearchMetadata                         = [SEARCH, false];
            WSops.Query                                     = [SEARCH, false];
            WSops.QueryEx                                   = [SEARCH, false];
            WSops.Registration                              = [SEARCH, false];
            WSops.Status                                    = [SEARCH, false];

            WSops.SPQuery                                   = [SPSEARCH, false];
            WSops.SPQueryEx                                 = [SPSEARCH, false];
            WSops.SPRegistration                            = [SPSEARCH, false];
            WSops.SPStatus                                  = [SPSEARCH, false];

            WSops.SendClientScriptErrorReport               = [SHAREPOINTDIAGNOSTICS,true];

            WSops.GetAttachments                            = [SITEDATA, false];
            WSops.EnumerateFolder                           = [SITEDATA, false];
            WSops.SiteDataGetList                           = [SITEDATA, false];
            WSops.SiteDataGetListCollection                 = [SITEDATA, false];
            WSops.SiteDataGetSite                           = [SITEDATA, false];
            WSops.SiteDataGetSiteUrl                        = [SITEDATA, false];
            WSops.SiteDataGetWeb                            = [SITEDATA, false];

            WSops.CreateWeb                                 = [SITES, true];
            WSops.DeleteWeb                                 = [SITES, false];
            WSops.GetSite                                   = [SITES, false];
            WSops.GetSiteTemplates                          = [SITES, false];

            WSops.AddComment                                = [SOCIALDATASERVICE, true];
            WSops.AddTag                                    = [SOCIALDATASERVICE, true];
            WSops.AddTagByKeyword                           = [SOCIALDATASERVICE, true];
            WSops.CountCommentsOfUser                       = [SOCIALDATASERVICE, false];
            WSops.CountCommentsOfUserOnUrl                  = [SOCIALDATASERVICE, false];
            WSops.CountCommentsOnUrl                        = [SOCIALDATASERVICE, false];
            WSops.CountRatingsOnUrl                         = [SOCIALDATASERVICE, false];
            WSops.CountTagsOfUser                           = [SOCIALDATASERVICE, false];
            WSops.DeleteComment                             = [SOCIALDATASERVICE, true];
            WSops.DeleteRating                              = [SOCIALDATASERVICE, true];
            WSops.DeleteTag                                 = [SOCIALDATASERVICE, true];
            WSops.DeleteTagByKeyword                        = [SOCIALDATASERVICE, true];
            WSops.DeleteTags                                = [SOCIALDATASERVICE, true];
            WSops.GetAllTagTerms                            = [SOCIALDATASERVICE, false];
            WSops.GetAllTagTermsForUrlFolder                = [SOCIALDATASERVICE, false];
            WSops.GetAllTagUrls                             = [SOCIALDATASERVICE, false];
            WSops.GetAllTagUrlsByKeyword                    = [SOCIALDATASERVICE, false];
            WSops.GetCommentsOfUser                         = [SOCIALDATASERVICE, false];
            WSops.GetCommentsOfUserOnUrl                    = [SOCIALDATASERVICE, false];
            WSops.GetCommentsOnUrl                          = [SOCIALDATASERVICE, false];
            WSops.GetRatingAverageOnUrl                     = [SOCIALDATASERVICE, false];
            WSops.GetRatingOfUserOnUrl                      = [SOCIALDATASERVICE, false];
            WSops.GetRatingOnUrl                            = [SOCIALDATASERVICE, false];
            WSops.GetRatingsOfUser                          = [SOCIALDATASERVICE, false];
            WSops.GetRatingsOnUrl                           = [SOCIALDATASERVICE, false];
            WSops.GetSocialDataForFullReplication           = [SOCIALDATASERVICE, false];
            WSops.GetTags                                   = [SOCIALDATASERVICE, true];
            WSops.GetTagsOfUser                             = [SOCIALDATASERVICE, true];
            WSops.GetTagTerms                               = [SOCIALDATASERVICE, true];
            WSops.GetTagTermsOfUser                         = [SOCIALDATASERVICE, true];
            WSops.GetTagTermsOnUrl                          = [SOCIALDATASERVICE, true];
            WSops.GetTagUrlsOfUser                          = [SOCIALDATASERVICE, true];
            WSops.GetTagUrlsOfUserByKeyword                 = [SOCIALDATASERVICE, true];
            WSops.GetTagUrls                                = [SOCIALDATASERVICE, true];
            WSops.GetTagUrlsByKeyword                       = [SOCIALDATASERVICE, true];
            WSops.SetRating                                 = [SOCIALDATASERVICE, true];
            WSops.UpdateComment                             = [SOCIALDATASERVICE, true];

            WSops.SpellCheck                                = [SPELLCHECK, false];

            // Taxonomy Service Calls
            // Updated 2011.01.27 by Thomas McMillan
            WSops.AddTerms                                  = [TAXONOMYSERVICE, true];
            WSops.GetChildTermsInTerm                       = [TAXONOMYSERVICE, false];
            WSops.GetChildTermsInTermSet                    = [TAXONOMYSERVICE, false];
            WSops.GetKeywordTermsByGuids                    = [TAXONOMYSERVICE, false];
            WSops.GetTermsByLabel                           = [TAXONOMYSERVICE, false];
            WSops.GetTermSets                               = [TAXONOMYSERVICE, false];

            WSops.AddGroup                                  = [USERGROUP, true];
            WSops.AddGroupToRole                            = [USERGROUP, true];
            WSops.AddRole                                   = [USERGROUP, true];
            WSops.AddRoleDef                                = [USERGROUP, true];
            WSops.AddUserCollectionToGroup                  = [USERGROUP, true];
            WSops.AddUserCollectionToRole                   = [USERGROUP, true];
            WSops.AddUserToGroup                            = [USERGROUP, true];
            WSops.AddUserToRole                             = [USERGROUP, true];
            WSops.GetAllUserCollectionFromWeb               = [USERGROUP, false];
            WSops.GetGroupCollection                        = [USERGROUP, false];
            WSops.GetGroupCollectionFromRole                = [USERGROUP, false];
            WSops.GetGroupCollectionFromSite                = [USERGROUP, false];
            WSops.GetGroupCollectionFromUser                = [USERGROUP, false];
            WSops.GetGroupCollectionFromWeb                 = [USERGROUP, false];
            WSops.GetGroupInfo                              = [USERGROUP, false];
            WSops.GetRoleCollection                         = [USERGROUP, false];
            WSops.GetRoleCollectionFromGroup                = [USERGROUP, false];
            WSops.GetRoleCollectionFromUser                 = [USERGROUP, false];
            WSops.GetRoleCollectionFromWeb                  = [USERGROUP, false];
            WSops.GetRoleInfo                               = [USERGROUP, false];
            WSops.GetRolesAndPermissionsForCurrentUser      = [USERGROUP, false];
            WSops.GetRolesAndPermissionsForSite             = [USERGROUP, false];
            WSops.GetUserCollection                         = [USERGROUP, false];
            WSops.GetUserCollectionFromGroup                = [USERGROUP, false];
            WSops.GetUserCollectionFromRole                 = [USERGROUP, false];
            WSops.GetUserCollectionFromSite                 = [USERGROUP, false];
            WSops.GetUserCollectionFromWeb                  = [USERGROUP, false];
            WSops.GetUserInfo                               = [USERGROUP, false];
            WSops.GetUserLoginFromEmail                     = [USERGROUP, false];
            WSops.RemoveGroup                               = [USERGROUP, true];
            WSops.RemoveGroupFromRole                       = [USERGROUP, true];
            WSops.RemoveRole                                = [USERGROUP, true];
            WSops.RemoveUserCollectionFromGroup             = [USERGROUP, true];
            WSops.RemoveUserCollectionFromRole              = [USERGROUP, true];
            WSops.RemoveUserCollectionFromSite              = [USERGROUP, true];
            WSops.RemoveUserFromGroup                       = [USERGROUP, true];
            WSops.RemoveUserFromRole                        = [USERGROUP, true];
            WSops.RemoveUserFromSite                        = [USERGROUP, true];
            WSops.RemoveUserFromWeb                         = [USERGROUP, true];
            WSops.UpdateGroupInfo                           = [USERGROUP, true];
            WSops.UpdateRoleDefInfo                         = [USERGROUP, true];
            WSops.UpdateRoleInfo                            = [USERGROUP, true];
            WSops.UpdateUserInfo                            = [USERGROUP, true];

            WSops.AddColleague                              = [USERPROFILESERVICE, true]; 
            WSops.AddLink                                   = [USERPROFILESERVICE, true];
            WSops.AddMembership                             = [USERPROFILESERVICE, true]; 
            WSops.AddPinnedLink                             = [USERPROFILESERVICE, true];
            WSops.CreateMemberGroup                         = [USERPROFILESERVICE, true]; 
            WSops.CreateUserProfileByAccountName            = [USERPROFILESERVICE, true];
            WSops.GetCommonColleagues                       = [USERPROFILESERVICE, false];
            WSops.GetCommonManager                          = [USERPROFILESERVICE, false];
            WSops.GetCommonMemberships                      = [USERPROFILESERVICE, false];
            WSops.GetInCommon                               = [USERPROFILESERVICE, false];
            WSops.GetPropertyChoiceList                     = [USERPROFILESERVICE, false];
            WSops.GetUserColleagues                         = [USERPROFILESERVICE, false];
            WSops.GetUserLinks                              = [USERPROFILESERVICE, false];
            WSops.GetUserMemberships                        = [USERPROFILESERVICE, false];
            WSops.GetUserPinnedLinks                        = [USERPROFILESERVICE, false];
            WSops.GetUserProfileByGuid                      = [USERPROFILESERVICE, false];
            WSops.GetUserProfileByIndex                     = [USERPROFILESERVICE, false];
            WSops.GetUserProfileByName                      = [USERPROFILESERVICE, false];
            WSops.GetUserProfileCount                       = [USERPROFILESERVICE, false];
            WSops.GetUserProfileSchema                      = [USERPROFILESERVICE, false];
            WSops.ModifyUserPropertyByAccountName           = [USERPROFILESERVICE, true];
            WSops.RemoveAllColleagues                       = [USERPROFILESERVICE, true];
            WSops.RemoveAllLinks                            = [USERPROFILESERVICE, true];
            WSops.RemoveAllMemberships                      = [USERPROFILESERVICE, true];
            WSops.RemoveAllPinnedLinks                      = [USERPROFILESERVICE, true];
            WSops.RemoveColleague                           = [USERPROFILESERVICE, true];
            WSops.RemoveLink                                = [USERPROFILESERVICE, true];
            WSops.RemoveMembership                          = [USERPROFILESERVICE, true];
            WSops.RemovePinnedLink                          = [USERPROFILESERVICE, true]; 
            WSops.UpdateColleaguePrivacy                    = [USERPROFILESERVICE, true];
            WSops.UpdateLink                                = [USERPROFILESERVICE, true];
            WSops.UpdateMembershipPrivacy                   = [USERPROFILESERVICE, true];
            WSops.UpdatePinnedLink                          = [USERPROFILESERVICE, true];

            WSops.DeleteAllVersions                         = [VERSIONS, true];
            WSops.DeleteVersion                             = [VERSIONS, true];
            WSops.GetVersions                               = [VERSIONS, false];
            WSops.RestoreVersion                            = [VERSIONS, true];

            WSops.AddView                                   = [VIEWS, true];
            WSops.DeleteView                                = [VIEWS, true];
            WSops.GetView                                   = [VIEWS, false];
            WSops.GetViewHtml                               = [VIEWS, false];
            WSops.GetViewCollection                         = [VIEWS, false];
            WSops.UpdateView                                = [VIEWS, true];
            WSops.UpdateViewHtml                            = [VIEWS, true];

            WSops.AddWebPart                                = [WEBPARTPAGES, true];
            WSops.AddWebPartToZone                          = [WEBPARTPAGES, true];
            WSops.GetWebPart2                               = [WEBPARTPAGES, false];
            WSops.GetWebPartPage                            = [WEBPARTPAGES, false];
            WSops.GetWebPartProperties                      = [WEBPARTPAGES, false];
            WSops.GetWebPartProperties2                     = [WEBPARTPAGES, false];

            WSops.CreateContentType                         = [WEBS, true];
            WSops.GetColumns                                = [WEBS, false];
            WSops.GetContentType                            = [WEBS, false];
            WSops.GetContentTypes                           = [WEBS, false];
            WSops.GetCustomizedPageStatus                   = [WEBS, false];
            WSops.GetListTemplates                          = [WEBS, false];
            WSops.GetObjectIdFromUrl                        = [WEBS, false]; // 2010
            WSops.GetWeb                                    = [WEBS, false];
            WSops.GetWebCollection                          = [WEBS, false];
            WSops.GetAllSubWebCollection                    = [WEBS, false];
            WSops.UpdateColumns                             = [WEBS, true];
            WSops.UpdateContentType                         = [WEBS, true];
            WSops.WebUrlFromPageUrl                         = [WEBS, false];

            WSops.AlterToDo                                 = [WORKFLOW, true];
            WSops.GetTemplatesForItem                       = [WORKFLOW, false];
            WSops.GetToDosForItem                           = [WORKFLOW, false];
            WSops.GetWorkflowDataForItem                    = [WORKFLOW, false];
            WSops.GetWorkflowTaskData                       = [WORKFLOW, false];
            WSops.StartWorkflow                             = [WORKFLOW, true];

            return new function() {
                // Main function, which calls SharePoint's Web Services directly.
                this.send = function(options) {

                    // If there are no options passed in, use the defaults.  Extend replaces each default with the passed option.
                    var opt = angular.extend({}, defaults, options);
                    opt.scope.payload = [];

                    opt.scope.opts = opt; // portal
                    if (!opt.scope[opt.accumulator]) opt.scope[opt.accumulator] = [];

                    // Encode options which may contain special character, esp. ampersand
                    for(var i=0; i < encodeOptionList.length; i++) {
                        if(typeof opt[encodeOptionList[i]] === "string") {
                            opt[encodeOptionList[i]] = encodeXml(opt[encodeOptionList[i]]);
                        }
                    }

                    // TODO: override headers

                    // Put together operation header and SOAPAction for the SOAP call based on which Web Service we're calling
                    SOAPEnvelope.opheader = ["<", opt.operation, " "];
                    switch(WSops[opt.operation][0]) {
                        case ALERTS:
                            SOAPEnvelope.opheader.push("xmlns='", SCHEMASharePoint, "/soap/2002/1/alerts/' >");
                            SOAPAction = [SCHEMASharePoint, "/soap/2002/1/alerts/"];
                            break;
                        case MEETINGS:
                            SOAPEnvelope.opheader.push("xmlns='", SCHEMASharePoint, "/soap/meetings/' >");
                            SOAPAction = [SCHEMASharePoint, "/soap/meetings/"];
                            break;
                        case PERMISSIONS:
                            SOAPEnvelope.opheader.push("xmlns='", SCHEMASharePoint, "/soap/directory/' >");
                            SOAPAction = [SCHEMASharePoint, "/soap/directory/"];
                            break;
                        case PUBLISHEDLINKSSERVICE:
                            SOAPEnvelope.opheader.push("xmlns='http://microsoft.com/webservices/SharePointPortalServer/PublishedLinksService/' >");
                            SOAPAction = ["http://microsoft.com/webservices/SharePointPortalServer/PublishedLinksService/"];
                            break;
                        case SEARCH:
                            SOAPEnvelope.opheader.push("xmlns='urn:Microsoft.Search' >");
                            SOAPAction = ["urn:Microsoft.Search/"];
                            break;
                        case SHAREPOINTDIAGNOSTICS:
                            SOAPEnvelope.opheader.push("xmlns='", SCHEMASharePoint, "/diagnostics/' >");
                            SOAPAction = ["http://schemas.microsoft.com/sharepoint/diagnostics/"];
                            break;
                        case SOCIALDATASERVICE:
                            SOAPEnvelope.opheader.push("xmlns='http://microsoft.com/webservices/SharePointPortalServer/SocialDataService' >");
                            SOAPAction = ["http://microsoft.com/webservices/SharePointPortalServer/SocialDataService/"];
                            break;
                        case SPELLCHECK:
                            SOAPEnvelope.opheader.push("xmlns='http://schemas.microsoft.com/sharepoint/publishing/spelling/' >");
                            SOAPAction = ["http://schemas.microsoft.com/sharepoint/publishing/spelling/SpellCheck"];
                            break;
                        case TAXONOMYSERVICE:
                            SOAPEnvelope.opheader.push("xmlns='", SCHEMASharePoint, "/taxonomy/soap/' >");
                            SOAPAction = [SCHEMASharePoint, "/taxonomy/soap/"];
                            break;
                        case USERGROUP:
                            SOAPEnvelope.opheader.push("xmlns='", SCHEMASharePoint, "/soap/directory/' >");
                            SOAPAction = [SCHEMASharePoint, "/soap/directory/"];
                            break;
                        case USERPROFILESERVICE:
                            SOAPEnvelope.opheader.push("xmlns='http://microsoft.com/webservices/SharePointPortalServer/UserProfileService' >");
                            SOAPAction = ["http://microsoft.com/webservices/SharePointPortalServer/UserProfileService/"];
                            break;
                        case WEBPARTPAGES:
                            SOAPEnvelope.opheader.push("xmlns='http://microsoft.com/sharepoint/webpartpages' >");
                            SOAPAction = ["http://microsoft.com/sharepoint/webpartpages/"];
                            break;
                        case WORKFLOW:
                            SOAPEnvelope.opheader.push("xmlns='", SCHEMASharePoint, "/soap/workflow/' >");
                            SOAPAction = [SCHEMASharePoint, "/soap/workflow/"];
                            break;
                        default:
                            SOAPEnvelope.opheader.push("xmlns='", SCHEMASharePoint, "/soap/'>");
                            SOAPAction = [SCHEMASharePoint, "/soap/"];
                            break;
                    }
                    
                    // Add the operation to the SOAPAction and opfooter
                    SOAPAction.push(opt.operation);
                    SOAPEnvelope.opfooter = ["</", opt.operation, ">"];

                    // Build the URL for the Ajax call based on which operation we're calling
                    // If the webURL has been provided, then use it, else use the current site
                    var ajaxURL = [opt.endPoint, WSops[opt.operation][0], ".asmx"];
                    if(opt.webURL.charAt(opt.webURL.length - 1) === SLASH) {
                        ajaxURL.unshift(opt.webURL);
                    } else if(opt.webURL.length > 0) {
                        ajaxURL.unshift(opt.webURL, SLASH);
                    } else {
                        var _spSite = SPGetCurrentSite(opt);
                        
                        if (_spSite !== SLASH)
                            ajaxURL.unshift(SPGetCurrentSite(opt), SLASH);
                        else
                            ajaxURL.unshift(SLASH);
                    }

                    SOAPEnvelope.payload = [];
                    // Each operation requires a different set of values.  This switch statement sets them up in the SOAPEnvelope.payload.
                    switch(opt.operation) {
                        // ALERT OPERATIONS
                        case "GetAlerts":
                            break;
                        case "DeleteAlerts":
                            SOAPEnvelope.payload.push("<IDs>");
                            for (i=0; i < opt.IDs.length; i++) {
                                SOAPEnvelope.payload.push(wrapNode("string", opt.IDs[i]));
                            }
                            SOAPEnvelope.payload.push("</IDs>");
                            break;

                        // AUTHENTICATION OPERATIONS
                        case "Mode":
                            break;
                        case "Login":
                            addToPayload(opt, ["username", "password"]);
                            break;

                        // COPY OPERATIONS
                        case "CopyIntoItems":
                            addToPayload(opt, ["SourceUrl"]);
                            SOAPEnvelope.payload.push("<DestinationUrls>");
                            for (i=0; i < opt.DestinationUrls.length; i++) {
                                SOAPEnvelope.payload.push(wrapNode("string", opt.DestinationUrls[i]));
                            }
                            SOAPEnvelope.payload.push("</DestinationUrls>");
                            addToPayload(opt, ["Fields", "Stream", "Results"]);
                            break;
                        case "CopyIntoItemsLocal":
                            addToPayload(opt, ["SourceUrl"]);
                            SOAPEnvelope.payload.push("<DestinationUrls>");
                            for (i=0; i < opt.DestinationUrls.length; i++) {
                                SOAPEnvelope.payload.push(wrapNode("string", opt.DestinationUrls[i]));
                            }
                            SOAPEnvelope.payload.push("</DestinationUrls>");
                            break;
                        case "GetItem":
                            addToPayload(opt, ["Url", "Fields", "Stream"]);
                            break;

                        // FORM OPERATIONS
                        case "GetForm":
                            addToPayload(opt, ["listName", "formUrl"]);
                            break;
                        case "GetFormCollection":
                            addToPayload(opt, ["listName"]);
                            break;

                        // LIST OPERATIONS
                        case "AddAttachment":
                            addToPayload(opt, ["listName", "listItemID", "fileName", "attachment"]);
                            break;
                        case "AddDiscussionBoardItem":
                            addToPayload(opt, ["listName", "message"]);
                            break;
                        case "AddList":
                            addToPayload(opt, ["listName", "description", "templateID"]);
                            break;
                        case "AddListFromFeature":
                            addToPayload(opt, ["listName", "description", "featureID", "templateID"]);
                            break;
                        case "ApplyContentTypeToList":
                            addToPayload(opt, ["webUrl", "contentTypeId", "listName"]);
                            break;
                        case "CheckInFile":
                            addToPayload(opt, ["pageUrl", "comment", "CheckinType"]);
                            break;
                        case "CheckOutFile":
                            addToPayload(opt, ["pageUrl", "checkoutToLocal", "lastmodified"]);
                            break;
                        case "CreateContentType":
                            addToPayload(opt, ["listName", "displayName", "parentType", "fields", "contentTypeProperties", "addToView"]);
                            break;
                        case "DeleteAttachment":
                            addToPayload(opt, ["listName", "listItemID", "url"]);
                            break;
                        case "DeleteContentType":
                            addToPayload(opt, ["listName", "contentTypeId"]);
                            break;
                        case "DeleteContentTypeXmlDocument":
                            addToPayload(opt, ["listName", "contentTypeId", "documentUri"]);
                            break;
                        case "DeleteList":
                            addToPayload(opt, ["listName"]);
                            break;
                        case "GetAttachmentCollection":
                            addToPayload(opt, ["listName", ["listItemID", "ID"]]);
                            break;
                        case "GetList":
                            addToPayload(opt, ["listName"]);
                            break;
                        case "GetListAndView":
                            addToPayload(opt, ["listName", "viewName"]);
                            break;
                        case "GetListCollection":
                            break;
                        case "GetListContentType":
                            addToPayload(opt, ["listName", "contentTypeId"]);
                            break;
                        case "GetListContentTypes":
                            addToPayload(opt, ["listName"]);
                            break;
                        case "GetListItems":
                            addToPayload(opt, ["listName", "viewName", ["query", "CAMLQuery"], ["viewFields", "CAMLViewFields"], ["rowLimit", "CAMLRowLimit"], ["queryOptions", "CAMLQueryOptions"]]);
                            break;
                        case "GetListItemChanges":
                            addToPayload(opt, ["listName", "viewFields", "since", "contains"]);
                            break;
                        case "GetListItemChangesSinceToken":
                            addToPayload(opt, ["listName", "viewName", "query", "viewFields", "rowLimit", "queryOptions", "changeToken", "contains"]);
                            break;
                        case "GetVersionCollection":
                            addToPayload(opt, ["strlistID", "strlistItemID", "strFieldName"]);
                            break;
                        case "UndoCheckOut":
                            addToPayload(opt, ["pageUrl"]);
                            break;
                        case "UpdateContentType":
                            addToPayload(opt, ["listName", "contentTypeId", "contentTypeProperties", "newFields", "updateFields", "deleteFields", "addToView"]);
                            break;
                        case "UpdateContentTypesXmlDocument":
                            addToPayload(opt, ["listName", "newDocument"]);
                            break;
                        case "UpdateContentTypeXmlDocument":
                            addToPayload(opt, ["listName", "contentTypeId", "newDocument"]);
                            break;
                        case "UpdateList":
                            addToPayload(opt, ["listName", "listProperties", "newFields", "updateFields", "deleteFields", "listVersion"]);
                            break;
                        case "UpdateListItems":
                            addToPayload(opt, ["listName"]);
                            if(typeof opt.updates !== "undefined" && opt.updates.length > 0) {
                                addToPayload(opt, ["updates"]);
                            } else {
                                SOAPEnvelope.payload.push("<updates><Batch OnError='Continue'><Method ID='1' Cmd='", opt.batchCmd, "'>");
                                for (i=0; i < opt.valuepairs.length; i++) { 
                                    SOAPEnvelope.payload.push("<Field Name='", opt.valuepairs[i][0], "'>", escapeColumnValue(opt.valuepairs[i][1]), "</Field>");
                                }
                                if(opt.batchCmd !== "New") {
                                    SOAPEnvelope.payload.push("<Field Name='ID'>", opt.ID, "</Field>");
                                }
                                SOAPEnvelope.payload.push("</Method></Batch></updates>");
                            }
                            break;

                        // MEETINGS OPERATIONS
                        case "AddMeeting":
                            addToPayload(opt, ["organizerEmail", "uid", "sequence", "utcDateStamp", "title", "location", "utcDateStart", "utcDateEnd", "nonGregorian"]);
                            break;
                        case "CreateWorkspace":
                            addToPayload(opt, ["title", "templateName", "lcid", "timeZoneInformation"]);
                            break;
                        case "RemoveMeeting":
                            addToPayload(opt, ["recurrenceId", "uid", "sequence", "utcDateStamp", "cancelMeeting"]);
                            break;
                        case "SetWorkspaceTitle":
                            addToPayload(opt, ["title"]);
                            break;

                        // PEOPLE OPERATIONS
                        case "ResolvePrincipals":
                            addToPayload(opt, ["principalKeys", "principalType", "addToUserInfoList"]);
                            break;
                        case "SearchPrincipals":
                            addToPayload(opt, ["searchText", "maxResults", "principalType"]);
                            break;

                        // PERMISSION OPERATIONS
                        case "AddPermission":
                            addToPayload(opt, ["objectName", "objectType", "permissionIdentifier", "permissionType", "permissionMask"]);
                            break;
                        case "AddPermissionCollection":
                            addToPayload(opt, ["objectName", "objectType", "permissionsInfoXml"]);
                            break;
                        case "GetPermissionCollection":
                            addToPayload(opt, ["objectName", "objectType"]);
                            break;
                        case "RemovePermission":
                            addToPayload(opt, ["objectName", "objectType", "permissionIdentifier", "permissionType"]);
                            break;
                        case "RemovePermissionCollection":
                            addToPayload(opt, ["objectName", "objectType", "memberIdsXml"]);
                            break;
                        case "UpdatePermission":
                            addToPayload(opt, ["objectName", "objectType", "permissionIdentifier", "permissionType", "permissionMask"]);
                            break;

                        // PUBLISHEDLINKSSERVICE OPERATIONS
                        case "GetLinks":
                            break;

                        // SEARCH OPERATIONS
                        case "GetPortalSearchInfo":
                            SOAPEnvelope.opheader = ["<", opt.operation, " xmlns='http://microsoft.com/webservices/OfficeServer/QueryService'>"];
                            SOAPAction = ["http://microsoft.com/webservices/OfficeServer/QueryService/", opt.operation];
                            break;
                        case "GetQuerySuggestions":
                            SOAPEnvelope.opheader = ["<", opt.operation, " xmlns='http://microsoft.com/webservices/OfficeServer/QueryService'>"];
                            SOAPAction = ["http://microsoft.com/webservices/OfficeServer/QueryService/", opt.operation];
                            SOAPEnvelope.payload.push(wrapNode("queryXml", encodeXml(opt.queryXml)));
                            break;
                        case "GetSearchMetadata":
                            SOAPEnvelope.opheader = ["<", opt.operation, " xmlns='http://microsoft.com/webservices/OfficeServer/QueryService'>"];
                            SOAPAction = ["http://microsoft.com/webservices/OfficeServer/QueryService/", opt.operation];
                            break;
                        case "Query":
                            SOAPEnvelope.payload.push(wrapNode("queryXml", encodeXml(opt.queryXml)));
                            break;
                        case "QueryEx":
                            SOAPEnvelope.opheader = ["<", opt.operation, " xmlns='http://microsoft.com/webservices/OfficeServer/QueryService'>"];
                            SOAPAction = ["http://microsoft.com/webservices/OfficeServer/QueryService/", opt.operation];
                            SOAPEnvelope.payload.push(wrapNode("queryXml", encodeXml(opt.queryXml)));
                            break;
                        case "Registration":
                            SOAPEnvelope.payload.push(wrapNode("registrationXml", encodeXml(opt.registrationXml)));
                            break;
                        case "Status":
                            break;

                        // SPSEARCH OPERATIONS
                        case "SPQuery":
                            SOAPEnvelope.payload.push(wrapNode("queryXml", encodeXml(opt.queryXml)));
                            break;
                        case "SPQueryEx":
                            SOAPEnvelope.opheader = ["<", opt.operation, " xmlns='http://microsoft.com/webservices/OfficeServer/QueryService'>"];
                            SOAPAction = ["http://microsoft.com/webservices/OfficeServer/QueryService/", opt.operation];
                            SOAPEnvelope.payload.push(wrapNode("queryXml", encodeXml(opt.queryXml)));
                            break;

                        // SHAREPOINTDIAGNOSTICS OPERATIONS
                        case "SendClientScriptErrorReport":
                            addToPayload(opt, ["message", "file", "line", "client", "stack", "team", "originalFile"]);
                            break;

                        // SITEDATA OPERATIONS
                        case "EnumerateFolder":
                            addToPayload(opt, ["strFolderUrl"]);
                            break;
                        case "GetAttachments":
                            addToPayload(opt, ["strListName", "strItemId"]);
                            break;
                        case "SiteDataGetList":
                            addToPayload(opt, ["strListName"]);
                            // Because this operation has a name which duplicates the Lists WS, need to handle
                            SOAPEnvelope = siteDataFixSOAPEnvelope(SOAPEnvelope, opt.operation);
                            break;
                        case "SiteDataGetListCollection":
                            // Because this operation has a name which duplicates the Lists WS, need to handle
                            SOAPEnvelope = siteDataFixSOAPEnvelope(SOAPEnvelope, opt.operation);
                            break;
                        case "SiteDataGetSite":
                            // Because this operation has a name which duplicates the Lists WS, need to handle
                            SOAPEnvelope = siteDataFixSOAPEnvelope(SOAPEnvelope, opt.operation);
                            break;
                        case "SiteDataGetSiteUrl":
                            addToPayload(opt, ["Url"]);
                            // Because this operation has a name which duplicates the Lists WS, need to handle
                            SOAPEnvelope = siteDataFixSOAPEnvelope(SOAPEnvelope, opt.operation);
                            break;
                        case "SiteDataGetWeb":
                            // Because this operation has a name which duplicates the Lists WS, need to handle
                            SOAPEnvelope = siteDataFixSOAPEnvelope(SOAPEnvelope, opt.operation);
                            break;

                        // SITES OPERATIONS
                        case "CreateWeb":
                            addToPayload(opt, ["url", "title", "description", "templateName", "language", "languageSpecified",
                                "locale", "localeSpecified", "collationLocale", "collationLocaleSpecified", "uniquePermissions",
                                "uniquePermissionsSpecified", "anonymous", "anonymousSpecified", "presence", "presenceSpecified"]);
                            break;
                        case "DeleteWeb":
                            addToPayload(opt, ["url"]);
                            break;
                        case "GetSite":
                            addToPayload(opt, ["SiteUrl"]);
                            break;
                        case "GetSiteTemplates":
                            addToPayload(opt, ["LCID", "TemplateList"]);
                            break;

                        // SOCIALDATASERVICE OPERATIONS
                        case "AddComment":
                            addToPayload(opt, ["url", "comment", "isHighPriority", "title"]);
                            break;
                        case "AddTag":
                            addToPayload(opt, ["url", "termID", "title", "isPrivate"]);
                            break;
                        case "AddTagByKeyword":
                            addToPayload(opt, ["url", "keyword", "title", "isPrivate"]);
                            break;
                        case "CountCommentsOfUser":
                            addToPayload(opt, ["userAccountName"]);
                            break;
                        case "CountCommentsOfUserOnUrl":
                            addToPayload(opt, ["userAccountName", "url"]);
                            break;
                        case "CountCommentsOnUrl":
                            addToPayload(opt, ["url"]);
                            break;
                        case "CountRatingsOnUrl":
                            addToPayload(opt, ["url"]);
                            break;
                        case "CountTagsOfUser":
                            addToPayload(opt, ["userAccountName"]);
                            break;
                        case "DeleteComment":
                            addToPayload(opt, ["url", "lastModifiedTime"]);
                            break;
                        case "DeleteRating":
                            addToPayload(opt, ["url"]);
                            break;
                        case "DeleteTag":
                            addToPayload(opt, ["url", "termID"]);
                            break;
                        case "DeleteTagByKeyword":
                            addToPayload(opt, ["url", "keyword"]);
                            break;
                        case "DeleteTags":
                            addToPayload(opt, ["url"]);
                            break;
                        case "GetAllTagTerms":
                            addToPayload(opt, ["maximumItemsToReturn"]);
                            break;
                        case "GetAllTagTermsForUrlFolder":
                            addToPayload(opt, ["urlFolder", "maximumItemsToReturn"]);
                            break;
                        case "GetAllTagUrls":
                            addToPayload(opt, ["termID"]);
                            break;
                        case "GetAllTagUrlsByKeyword":
                            addToPayload(opt, ["keyword"]);
                            break;
                        case "GetCommentsOfUser":
                            addToPayload(opt, ["userAccountName", "maximumItemsToReturn", "startIndex"]);
                            break;
                        case "GetCommentsOfUserOnUrl":
                            addToPayload(opt, ["userAccountName", "url"]);
                            break;
                        case "GetCommentsOnUrl":
                            addToPayload(opt, ["url", "maximumItemsToReturn", "startIndex"]);
                            if(typeof opt.excludeItemsTime !== "undefined" && opt.excludeItemsTime.length > 0) {
                                SOAPEnvelope.payload.push(wrapNode("excludeItemsTime", opt.excludeItemsTime));
                            }
                            break;
                        case "GetRatingAverageOnUrl":
                            addToPayload(opt, ["url"]);
                            break;
                        case "GetRatingOfUserOnUrl":
                            addToPayload(opt, ["userAccountName", "url"]);
                            break;
                        case "GetRatingOnUrl":
                            addToPayload(opt, ["url"]);
                            break;
                        case "GetRatingsOfUser":
                            addToPayload(opt, ["userAccountName"]);
                            break;
                        case "GetRatingsOnUrl":
                            addToPayload(opt, ["url"]);
                            break;
                        case "GetSocialDataForFullReplication":
                            addToPayload(opt, ["userAccountName"]);
                            break;
                        case "GetTags":
                            addToPayload(opt, ["url"]);
                            break;
                        case "GetTagsOfUser":
                            addToPayload(opt, ["userAccountName", "maximumItemsToReturn", "startIndex"]);
                            break;
                        case "GetTagTerms":
                            addToPayload(opt, ["maximumItemsToReturn"]);
                            break;
                        case "GetTagTermsOfUser":
                            addToPayload(opt, ["userAccountName", "maximumItemsToReturn"]);
                            break;
                        case "GetTagTermsOnUrl":
                            addToPayload(opt, ["url", "maximumItemsToReturn"]);
                            break;
                        case "GetTagUrls":
                            addToPayload(opt, ["termID"]);
                            break;
                        case "GetTagUrlsByKeyword":
                            addToPayload(opt, ["keyword"]);
                            break;
                        case "GetTagUrlsOfUser":
                            addToPayload(opt, ["termID", "userAccountName"]);
                            break;
                        case "GetTagUrlsOfUserByKeyword":
                            addToPayload(opt, ["keyword", "userAccountName"]);
                            break;
                        case "SetRating":
                            addToPayload(opt, ["url", "rating", "title", "analysisDataEntry"]);
                            break;
                        case "UpdateComment":
                            addToPayload(opt, ["url", "lastModifiedTime", "comment", "isHighPriority"]);
                            break;

                        // SPELLCHECK OPERATIONS 
                        case "SpellCheck":
                            addToPayload(opt, ["chunksToSpell", "declaredLanguage", "useLad"]);
                            break;

                       // TAXONOMY OPERATIONS 
                        case "AddTerms":
                            addToPayload(opt, ["sharedServiceId", "termSetId", "lcid", "newTerms"]);
                            break;
                        case "GetChildTermsInTerm":
                            addToPayload(opt, ["sspId", "lcid", "termId", "termSetId"]);
                            break;
                        case "GetChildTermsInTermSet":
                            addToPayload(opt, ["sspId", "lcid", "termSetId"]);
                            break;
                        case "GetKeywordTermsByGuids":
                            addToPayload(opt, ["termIds", "lcid"]);
                            break;
                        case "GetTermsByLabel":
                            addToPayload(opt, ["label", "lcid", "matchOption", "resultCollectionSize", "termIds", "addIfNotFound"]);
                            break;
                        case "GetTermSets":
                            addToPayload(opt, ["sharedServiceId", "termSetId", "lcid", "clientTimeStamps", "clientVersions"]);
                            break;

                        // USERS AND GROUPS OPERATIONS
                        case "AddGroup":
                            addToPayload(opt, ["groupName", "ownerIdentifier", "ownerType", "defaultUserLoginName", "description"]);
                            break;
                        case "AddGroupToRole":
                            addToPayload(opt, ["groupName", "roleName"]);
                            break;
                        case "AddRole":
                            addToPayload(opt, ["roleName", "description", "permissionMask"]);
                            break;
                        case "AddRoleDef":
                            addToPayload(opt, ["roleName", "description", "permissionMask"]);
                            break;
                        case "AddUserCollectionToGroup":
                            addToPayload(opt, ["groupName", "usersInfoXml"]);
                            break;
                        case "AddUserCollectionToRole":
                            addToPayload(opt, ["roleName", "usersInfoXml"]);
                            break;
                        case "AddUserToGroup":
                            addToPayload(opt, ["groupName", "userName", "userLoginName", "userEmail", "userNotes"]);
                            break;
                        case "AddUserToRole":
                            addToPayload(opt, ["roleName", "userName", "userLoginName", "userEmail", "userNotes"]);
                            break;
                        case "GetAllUserCollectionFromWeb":
                            break;
                        case "GetGroupCollection":
                            addToPayload(opt, ["groupNamesXml"]);
                            break;
                        case "GetGroupCollectionFromRole":
                            addToPayload(opt, ["roleName"]);
                            break;
                        case "GetGroupCollectionFromSite":
                            break;
                        case "GetGroupCollectionFromUser":
                            addToPayload(opt, ["userLoginName"]);
                            break;
                        case "GetGroupCollectionFromWeb":
                            break;
                        case "GetGroupInfo":
                            addToPayload(opt, ["groupName"]);
                            break;
                        case "GetRoleCollection":
                            addToPayload(opt, ["roleNamesXml"]);
                            break;
                        case "GetRoleCollectionFromGroup":
                            addToPayload(opt, ["groupName"]);
                            break;
                        case "GetRoleCollectionFromUser":
                            addToPayload(opt, ["userLoginName"]);
                            break;
                        case "GetRoleCollectionFromWeb":
                            break;
                        case "GetRoleInfo":
                            addToPayload(opt, ["roleName"]);
                            break;
                        case "GetRolesAndPermissionsForCurrentUser":
                            break;
                        case "GetRolesAndPermissionsForSite":
                            break;
                        case "GetUserCollection":
                            addToPayload(opt, ["userLoginNamesXml"]);
                            break;
                        case "GetUserCollectionFromGroup":
                            addToPayload(opt, ["groupName"]);
                            break;
                        case "GetUserCollectionFromRole":
                            addToPayload(opt, ["roleName"]);
                            break;
                        case "GetUserCollectionFromSite":
                            break;
                        case "GetUserCollectionFromWeb":
                            break;
                        case "GetUserInfo":
                            addToPayload(opt, ["userLoginName"]);
                            break;
                        case "GetUserLoginFromEmail":
                            addToPayload(opt, ["emailXml"]);
                            break;
                        case "RemoveGroup":
                            addToPayload(opt, ["groupName"]);
                            break;
                        case "RemoveGroupFromRole":
                            addToPayload(opt, ["roleName", "groupName"]);
                            break;
                        case "RemoveRole":
                            addToPayload(opt, ["roleName"]);
                            break;
                        case "RemoveUserCollectionFromGroup":
                            addToPayload(opt, ["groupName", "userLoginNamesXml"]);
                            break;
                        case "RemoveUserCollectionFromRole":
                            addToPayload(opt, ["roleName", "userLoginNamesXml"]);
                            break;
                        case "RemoveUserCollectionFromSite":
                            addToPayload(opt, ["userLoginNamesXml"]);
                            break;
                        case "RemoveUserFromGroup":
                            addToPayload(opt, ["groupName", "userLoginName"]);
                            break;
                        case "RemoveUserFromRole":
                            addToPayload(opt, ["roleName", "userLoginName"]);
                            break;
                        case "RemoveUserFromSite":
                            addToPayload(opt, ["userLoginName"]);
                            break;
                        case "RemoveUserFromWeb":
                            addToPayload(opt, ["userLoginName"]);
                            break;
                        case "UpdateGroupInfo":
                            addToPayload(opt, ["oldGroupName", "groupName", "ownerIdentifier", "ownerType", "description"]);
                            break;
                        case "UpdateRoleDefInfo":
                            addToPayload(opt, ["oldRoleName", "roleName", "description", "permissionMask"]);
                            break;
                        case "UpdateRoleInfo":
                            addToPayload(opt, ["oldRoleName", "roleName", "description", "permissionMask"]);
                            break;
                        case "UpdateUserInfo":
                            addToPayload(opt, ["userLoginName", "userName", "userEmail", "userNotes"]);
                            break;

                        // USERPROFILESERVICE OPERATIONS
                        case "AddColleague":
                            addToPayload(opt, ["accountName", "colleagueAccountName", "group", "privacy", "isInWorkGroup"]);
                            break;                                                                          
                        case "AddLink":
                            addToPayload(opt, ["accountName", "name", "url", "group", "privacy"]);
                            break;                                                                                      
                        case "AddMembership":
                            addToPayload(opt, ["accountName", "membershipInfo", "group", "privacy"]);
                            break;                                                          
                        case "AddPinnedLink":
                            addToPayload(opt, ["accountName", "name", "url"]);
                            break;
                        case "CreateMemberGroup":
                            addToPayload(opt, ["membershipInfo"]);
                            break;
                        case "CreateUserProfileByAccountName":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetCommonColleagues":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetCommonManager":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetCommonMemberships":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetInCommon":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetPropertyChoiceList":
                            addToPayload(opt, ["propertyName"]);
                            break;
                        case "GetUserColleagues":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetUserLinks":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetUserMemberships":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetUserPinnedLinks":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "GetUserProfileByGuid":
                            addToPayload(opt, ["guid"]);
                            break;
                        case "GetUserProfileByIndex":
                            addToPayload(opt, ["index"]);
                            break;
                        case "GetUserProfileByName":
                            // Note that this operation is inconsistent with the others, using AccountName rather than accountName
                            if(typeof opt.accountName !== "undefined" && opt.accountName.length > 0) {
                                addToPayload(opt, [["AccountName", "accountName"]]);
                            } else {
                                addToPayload(opt, ["AccountName"]);
                            }
                            break;
                        case "GetUserProfileCount":
                            break;
                        case "GetUserProfileSchema":
                            break;
                        case "ModifyUserPropertyByAccountName":
                            addToPayload(opt, ["accountName", "newData"]);
                            break;
                        case "RemoveAllColleagues":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "RemoveAllLinks":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "RemoveAllMemberships":
                            addToPayload(opt, ["accountName"]);
                            break;
                        case "RemoveAllPinnedLinks":
                            addToPayload(opt, ["accountName"]);
                            break;  
                        case "RemoveColleague":
                            addToPayload(opt, ["accountName", "colleagueAccountName"]);
                            break;  
                        case "RemoveLink":
                            addToPayload(opt, ["accountName", "id"]);
                            break;
                        case "RemoveMembership":
                            addToPayload(opt, ["accountName", "sourceInternal", "sourceReference"]);
                            break;
                        case "RemovePinnedLink":
                            addToPayload(opt, ["accountName", "id"]);
                            break;                                                                                          
                        case "UpdateColleaguePrivacy":
                            addToPayload(opt, ["accountName", "colleagueAccountName", "newPrivacy"]);
                            break;
                        case "UpdateLink":
                            addToPayload(opt, ["accountName", "data"]);
                            break;          
                        case "UpdateMembershipPrivacy":  
                            addToPayload(opt, ["accountName", "sourceInternal", "sourceReference", "newPrivacy"]);
                            break;
                        case "UpdatePinnedLink ":
                            addToPayload(opt, ["accountName", "data"]);
                            break;

                        // VERSIONS OPERATIONS
                        case "DeleteAllVersions":
                            addToPayload(opt, ["fileName"]);
                            break;
                        case "DeleteVersion":
                            addToPayload(opt, ["fileName", "fileVersion"]);
                            break;
                        case "GetVersions":
                            addToPayload(opt, ["fileName"]);
                            break;
                        case "RestoreVersion":
                            addToPayload(opt, ["fileName", "fileVersion"]);
                            break;

                        // VIEW OPERATIONS
                        case "AddView":
                            addToPayload(opt, ["listName", "viewName", "viewFields", "query", "rowLimit", "rowLimit", "type", "makeViewDefault"]);
                            break;
                        case "DeleteView":
                            addToPayload(opt, ["listName", "viewName"]);
                            break;
                        case "GetView":
                            addToPayload(opt, ["listName", "viewName"]);
                            break;
                        case "GetViewCollection":
                            addToPayload(opt, ["listName"]);
                            break;
                        case "GetViewHtml":
                            addToPayload(opt, ["listName", "viewName"]);
                            break;
                        case "UpdateView":
                            addToPayload(opt, ["listName", "viewName", "viewProperties", "query", "viewFields", "aggregations", "formats", "rowLimit"]);
                            break;
                        case "UpdateViewHtml":
                            addToPayload(opt, ["listName", "viewName", "viewProperties", "toolbar", "viewHeader", "viewBody", "viewFooter", "viewEmpty", "rowLimitExceeded",
                                "query", "viewFields", "aggregations", "formats", "rowLimit"]);
                            break;

                        // WEBPARTPAGES OPERATIONS
                        case "AddWebPart":
                            addToPayload(opt, ["pageUrl", "webPartXml", "storage"]);
                            break;
                        case "AddWebPartToZone":
                            addToPayload(opt, ["pageUrl", "webPartXml", "storage", "zoneId", "zoneIndex"]);
                            break;
                        case "GetWebPart2":
                            addToPayload(opt, ["pageUrl", "storageKey", "storage", "behavior"]);
                            break;
                        case "GetWebPartPage":
                            addToPayload(opt, ["documentName", "behavior"]);
                            break;
                        case "GetWebPartProperties":
                            addToPayload(opt, ["pageUrl", "storage"]);
                            break;
                        case "GetWebPartProperties2":
                            addToPayload(opt, ["pageUrl", "storage", "behavior"]);
                            break;

                        // WEBS OPERATIONS
                        case "Webs.CreateContentType":
                            addToPayload(opt, ["displayName", "parentType", "newFields", "contentTypeProperties"]);
                            break;
                        case "GetColumns":
                            addToPayload(opt, ["webUrl"]);
                            break;
                        case "GetContentType":
                            addToPayload(opt, ["contentTypeId"]);
                            break;
                        case "GetContentTypes":
                            break;
                        case "GetCustomizedPageStatus":
                            addToPayload(opt, ["fileUrl"]);
                            break;
                        case "GetListTemplates":
                            break;
                        case "GetObjectIdFromUrl":
                            addToPayload(opt, ["objectUrl"]);
                            break;
                        case "GetWeb":
                            addToPayload(opt, [["webUrl", "webURL"]]);
                            break;
                        case "GetWebCollection":
                            break;
                        case "GetAllSubWebCollection":
                            break;
                        case "UpdateColumns":
                            addToPayload(opt, ["newFields", "updateFields", "deleteFields"]);
                            break;              
                        case "Webs.UpdateContentType":
                            addToPayload(opt, ["contentTypeId", "contentTypeProperties", "newFields", "updateFields", "deleteFields"]);
                            break;              
                        case "WebUrlFromPageUrl":
                            addToPayload(opt, [["pageUrl", "pageURL"]]);
                            break;

                        // WORKFLOW OPERATIONS
                        case "AlterToDo":
                            addToPayload(opt, ["item", "todoId", "todoListId", "taskData"]);
                            break;
                        case "GetTemplatesForItem":
                            addToPayload(opt, ["item"]);
                            break;
                        case "GetToDosForItem":
                            addToPayload(opt, ["item"]);
                            break;
                        case "GetWorkflowDataForItem":
                            addToPayload(opt, ["item"]);
                            break;
                        case "GetWorkflowTaskData":
                            addToPayload(opt, ["item", "listId", "taskId"]);
                            break;
                        case "StartWorkflow":
                            addToPayload(opt, ["item", "templateId", "workflowParameters"]);
                            break;

                        default:
                            break;
                    }

                    // End SPServices code http://spservices.codeplex.com/

                    // Glue together the pieces of the SOAP message
                    var msg = [
                            SOAPEnvelope.header,
                            SOAPEnvelope.opheader.join(''),
                            SOAPEnvelope.payload.join(''),
                            SOAPEnvelope.opfooter.join(''),
                            SOAPEnvelope.footer
                        ].join(''),
                        promise = $http({
                            method: 'POST',
                            url: ajaxURL.join(''),
                            data: msg,
                            responseType: "document",
                            headers: {
                                "Content-Type": "text/xml;charset='utf-8'"
                            },
                            transformRequest: function(data, headersGetter) {
                                if (WSops[opt.operation][1]) {
                                    var headers = headersGetter();
                                    headers["SOAPAction"] = SOAPAction.join('');
                                }
                                return data;
                            },
                            transformResponse: function(data, headersGetter) {
                                if (data) {
                                    var ret = xmlToJSON(
                                        data,
                                        {
                                            regex: /ows_/,
                                            regexReplacement: ""
                                        }
                                    )["soap:Envelope"]["soap:Body"];

                                    return _.reduce(
                                        AngularSPHelper.comb[opt.operation.toLowerCase()],
                                        function(memo, item) {
                                            return memo[item];
                                        },
                                        ret
                                    );
                                }
                            }
                        });

                    if (angular.isFunction(opt.completefunc)) {
                        promise.success(opt.completefunc);
                    }

                    if (angular.isFunction(opt.errorfunc)) {
                        promise.error(opt.errorfunc);
                    }
                    else if (angular.isFunction(opt.completefunc)) {
                        promise.error(opt.completefunc);
                    }

                    return promise;
                };
/*
                scope.opt = {};
                scope.opt.Ids = ["asd","asdf","ghdf","ytu"];
                scope.httpHeaders = {};

                scope.opt.Url = "ssdfsdf";
                scope.opt.Fields = "sdfsdfsdfsdf";
                scope.opt.Stream = "streeeeeam";

                scope.opt.listName = "1234564-123-235-223";
                scope.opt.batchCmd = "New";
                scope.opt.valuepairs = [
                    ["blah1", "blah1Value"],
                    ["blah2", "blah2Value"],
                    ["blah3", "blah3Value"]
                ];

                this.testMe = function(operation) {
                    var t = ["<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'><soap:Body><", SPServicesEndpoints.convertFromCamelCase(operation), "/></soap:Body></soap:Envelope>"].join('');

scope.endPoint = "";

                    var k = $compile(t)(scope);

                    setTimeout(function() {
                        var t2 = angular.element("<p></p>");
                        t2.append(k);
console.log("t2.html", t2);
console.log("t", t);
console.log("k", k);
                        $http({
                            method: 'POST',
                            url: '/',
                            data: t2.html(),
                            responseType: "document",
                            headers: {
                                "Content-Type": "text/xml;charset='utf-8'"
                            }
                        });
                    }, 1);

                    //return k;
                    
                }*/

            };
        }
    ]
);