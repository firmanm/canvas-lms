var webpack = require("webpack");
var child_process = require('child_process');
var I18nPlugin = require("./i18nPlugin");
var ClientAppsPlugin = require("./clientAppPlugin");
var CompiledReferencePlugin = require("./CompiledReferencePlugin");
var bundleEntries = require("./bundles");
var BundleExtensionsPlugin = require("./BundleExtensionsPlugin");
var WebpackOnBuildPlugin = require('on-build-webpack');
var path = require('path');
require('babel-polyfill')

module.exports = {
  devtool: 'eval',
  entry: bundleEntries,
  output: {
    path: __dirname + '/../public/webpack-dist',
    filename: "[name].bundle.js",
    chunkFilename: "[id].bundle.js",
    publicPath: "/webpack-dist/"
  },
  resolveLoader: {
    modulesDirectories: ['node_modules','frontend_build']
  },
  resolve: {
    alias: {
      'old_version_of_react_used_by_canvas_quizzes_client_apps': __dirname + '/../client_apps/canvas_quizzes/vendor/js/old_version_of_react_used_by_canvas_quizzes_client_apps',
      handlebars: __dirname + '/../node_modules/handlebars/dist/handlebars.runtime',
      'node_modules-version-of-backbone': __dirname + '/../node_modules/backbone',
      'node_modules-version-of-moment': __dirname + '/../node_modules/moment',
      'node_modules-version-of-react-modal': __dirname + '/../node_modules/react-modal',

      // once we are all-webpack we should remove this line and just change all the 'require's
      // to instructure-ui compnentns to have the right path
      'instructure-ui': __dirname + '/../node_modules/instructure-ui/lib/components',

      // see comment at the top of this file for how we should do this better
      moment: 'custom_moment_locales/mi_nz',

      qtip: "jquery.qtip",
      'backbone': 'Backbone',
      'timezone': 'timezone_webpack_shim'
    },
    root: [
      __dirname + "/../public/javascripts",
      __dirname + "/../app",
      __dirname + "/../app/views",
      __dirname + "/../client_apps",
      __dirname + "/../gems/plugins",
      __dirname + "/../public/javascripts/vendor",
      __dirname + "/../client_apps/canvas_quizzes/vendor/js",
      __dirname + "/../client_apps/canvas_quizzes/vendor/packages"
    ],
    extensions: [
      "",
      ".webpack.js",
      ".web.js",
      ".js",
      ".jsx",
      ".coffee",
      ".handlebars",
      ".hbs"
    ]
  },
  module: {
    preLoaders: [],
    noParse: [],
    loaders: [

      // to get tinymce to work. see: https://github.com/tinymce/tinymce/issues/2836
      {
        test: require.resolve('tinymce/tinymce'),
        loaders: [
          'imports?this=>window',
          'exports?window.tinymce'
        ]
      },
      {
        test: /tinymce\/(themes|plugins)\//,
        loaders: [
          'imports?this=>window'
        ]
      },


      {
        test: /\.js$/,
        include: path.resolve(__dirname, "../public/javascripts"),
        loaders: [
          "jsHandlebarsHelpers",
          "pluginsJstLoader",
          "nonAmdLoader"
        ]
      },
      {
        test: /\.jsx$/,
        include: [
          path.resolve(__dirname, "../app/jsx"),
          path.resolve(__dirname, "../spec/javascripts/jsx"),
          /gems\/plugins\/.*\/app\/jsx\//
        ],
        exclude: [
          /(node_modules|bower)/,
          /public\/javascripts\/vendor/,
          /public\/javascripts\/translations/,
          /client_apps\/canvas_quizzes\/apps\//
        ],
        loaders: [
          // make sure we don't try to cache JSX assets when building for production
          'babel' + (process.env.NODE_ENV === 'production' ? '': '?cacheDirectory=tmp')
        ]
      },
      {
        test: /\.jsx$/,
        include: [/client_apps\/canvas_quizzes\/apps\//],
        exclude: [/(node_modules|bower)/, /public\/javascripts\/vendor/, /public\/javascripts\/translations/, path.resolve(__dirname, "../app/jsx")],
        loaders: ["jsx"]
      },
      {
        test: /\.coffee$/,
        include: [
          path.resolve(__dirname, "../app/coffeescript"),
          path.resolve(__dirname, "../spec/coffeescripts"),
          /gems\/plugins\/.*\/app\/coffeescripts\//,
          /gems\/plugins\/.*\/spec_canvas\/coffeescripts\//
        ],
        loaders: [
          "coffee-loader",
          "jsHandlebarsHelpers",
          "pluginsJstLoader",
          "nonAmdLoader"
        ] },
      {
        test: /\.handlebars$/,
        include: [
          path.resolve(__dirname, "../app/views/jst"),
          /gems\/plugins\/.*\/app\/views\/jst\//
        ],
        exclude: /bower/,
        loaders: [
          "i18nLinerHandlebars"
        ]
      },
      {
        test: /\.hbs$/,
        include: [
          /app\/coffeescripts\/ember\/screenreader_gradebook\/templates\//,
          /app\/coffeescripts\/ember\/shared\/templates\//
        ],
        exclude: /bower/,
        loaders: [
          "emberHandlebars"
        ]
      },
      {
        test: /\.json$/,
        include: path.resolve(__dirname, "../public/javascripts"),
        exclude: [/(node_modules|bower)/, /public\/javascripts\/vendor/],
        loader: "json-loader"
      },
      {
        test: /vendor\/jquery-1\.7\.2/,
        include: path.resolve(__dirname, "../public/javascripts/vendor"),
        loader: "exports-loader?window.jQuery"
      },
      {
        test: /node_modules\/handlebars\/dist\/handlebars\.runtime/,
        loader: "exports-loader?Handlebars"
      },
      {
        test: /vendor\/md5/,
        loader: "exports-loader?CryptoJS"
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    new I18nPlugin(),
    new ClientAppsPlugin(),
    new CompiledReferencePlugin(),
    new BundleExtensionsPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      names: ["instructure-common", "vendor"],
      minChunks: Infinity
    }),
    new webpack.IgnorePlugin(/\.md$/),
    new webpack.IgnorePlugin(/(CHANGELOG|LICENSE|README)$/),
    new webpack.IgnorePlugin(/package.json/),
    new WebpackOnBuildPlugin(function(stats){
      if(process.env.SKIP_JS_REV){
        console.log("skipping rev...");
      }else{
        child_process.spawn("gulp", ["rev"]);
      }
    }),
    new webpack.PrefetchPlugin("./app/coffeescripts/calendar/ContextSelector.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/calendar/TimeBlockRow.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/react_files/components/FolderTree.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/react_files/components/Toolbar.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/react_files/utils/moveStuff.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/views/grade_summary/OutcomeLineGraphView.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/views/grade_summary/OutcomeView.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/views/groups/manage/AssignToGroupMenu.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/views/groups/manage/EditGroupAssignmentView.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/views/groups/manage/GroupUserView.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/views/MoveDialogSelect.coffee"),
    new webpack.PrefetchPlugin("./app/coffeescripts/widget/TokenInput.coffee"),
    new webpack.PrefetchPlugin("./app/jsx/assignments/ModerationApp.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/authentication_providers/AuthTypePicker.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/context_modules/FileSelectBox.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/course_wizard/Checklist.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/dashboard_card/DashboardCard.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/due_dates/DueDates.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/due_dates/DueDateCalendarPicker.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/epub_exports/CourseListItem.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/external_apps/components/AppDetails.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/external_apps/components/AppList.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/external_apps/components/Configurations.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/external_apps/components/ConfigurationForm.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/external_apps/components/ConfigurationFormUrl.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/external_apps/components/ExternalToolsTableRow.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/files/BreadcrumbCollapsedContainer.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/files/CurrentUploads.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/files/DialogPreview.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/files/FilesApp.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/files/FilePreview.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/files/ShowFolder.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/files/UploadButton.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/files/utils/openMoveDialog.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/gradebook/SISGradePassback/PostGradesApp.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/gradebook/SISGradePassback/PostGradesDialogCorrectionsPage.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/grading/gradingPeriodCollection.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/grading/gradingStandardCollection.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/groups/components/PaginatedGroupList.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/shared/ColorPicker.jsx"),
    new webpack.PrefetchPlugin("./app/jsx/theme_editor/ThemeEditorAccordion.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/common/js/core/dispatcher.js"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/events/js/bundles/routes.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/events/js/routes/event_stream.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/events/js/routes/question.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/events/js/views/answer_matrix.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/events/js/views/answer_matrix/inverted_table.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/events/js/views/question_inspector.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/events/js/views/question_inspector/answers/essay.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/events/js/stores/events.js"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/statistics/js/stores/reports.js"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/statistics/js/stores/statistics.js"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/statistics/js/views/app.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/statistics/js/views/questions/multiple_choice.jsx"),
    new webpack.PrefetchPlugin("./client_apps/canvas_quizzes/apps/statistics/js/views/summary/report.jsx"),
  ]
};
