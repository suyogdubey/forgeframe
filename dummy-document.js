"use strict";
const React = require("react");
exports.Html = function Html(p) { return React.createElement("html", p, p.children); };
exports.Head = function Head(p) { return React.createElement("head", p, p.children); };
exports.Main = function Main(p) { return React.createElement("div", p, p.children); };
exports.NextScript = function NextScript(p) { return React.createElement("script", p); };
exports.default = class Document extends React.Component {
  render() {
    return React.createElement(exports.Html, null,
      React.createElement(exports.Head, null),
      React.createElement("body", null,
        React.createElement(exports.Main, null),
        React.createElement(exports.NextScript, null)
      )
    );
  }
};
