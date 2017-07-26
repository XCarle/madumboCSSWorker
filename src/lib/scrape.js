const CDP = require("chrome-remote-interface");

let myUniqueLinks = "";

async function scrape(client) {
    const { CSS, DOM } = client;

    // Get document root element nodeId
    const rootElement = await DOM.getDocument({depth:2});

    const { root: { nodeId } } = rootElement;

    console.log("rootelem : ", rootElement);

    console.log("--------------- PROCESSED URL : ", rootElement.root.baseURL);

    // 1 - Use seletor to get the links
    const { nodeIds: linkIDs } = await DOM.querySelectorAll({
        selector: "a",
        nodeId,
    });

    // 1 - Get each element attributes in order to calc Page Links
    const linkAttributes = await Promise.all(linkIDs.map((ID) =>
        DOM.getAttributes({ nodeId: ID })
    ));

    console.log("----------------- Get Page links : DONE");

    // 2 - Use seletor to get the CSS files
    const { nodeIds: linkCss } = await DOM.querySelectorAll({
        selector: "link",
        nodeId,
    });

    // 2 - get css attributes from the page
    const cssAttributes = await Promise.all(linkCss.map((ID) =>
        DOM.getAttributes({ nodeId: ID })
    ));

    // 2 - get all loaded CSS attributes from CSS pages
    const loadedCSSAttributes = await Promise.all(linkCss.map((ID) =>
        //CSS.getInlineStylesForNode({ nodeId: ID })
        //CSS.getMatchedStylesForNode({ nodeId: ID })
        CSS.getComputedStyleForNode({ nodeId: ID })
    ));

    console.log("----------------- Get Loaded CSS : DONE");

    // 3 - Option to get loaded CSS
    const loadedinDOMCss = DOM.requestChildNodes({ nodeId: rootElement.root.nodeId, depth: -1 });

    const loadedCSSstyles = loadedCSSAttributes
        .map(x => x.computedStyle);

    const myLoadedCSSStyle = [];

    // print info about css attributes
    if (true){
      for (var i = 0; i < loadedCSSAttributes.length; i++ ){
        for (var j = 0; j < loadedCSSAttributes[i].computedStyle.length; j++ ){
          //console.log("loadedCSSAttributes :", i, " - ", j, " : ", loadedCSSAttributes[i].computedStyle[j].name);
          myLoadedCSSStyle.push(loadedCSSAttributes[i].computedStyle[j].name);
        }
      }
    }

    // 3 - get used css style in DOM
    //const cssDOMAttributes = await CSS.getMatchedStylesForNode({ nodeId: ID })

    //console.log();
        //CSS.getInlineStylesForNode({ nodeId: ID })

        //CSS.getComputedStyleForNode({ nodeId: ID })


    //for (var i = 0; i < csscssAttributes.length; i++){
    //  const results = await client.CSS.collectClassNames({styleSheetId:  csscssAttributes[i].inlineStyle.styleSheetId});
    //  console.log("results : ", results);
    //  console.log("------------------------------------");
    //}
    //const styleSheets = await Promise.all(csscssAttributes[0].inlineStyle.styleSheetId.map((ID) =>
    //    CSS.getStyleSheetText({ styleSheetId: ID })
    //));


    //console.log("csscssAttributes : selectorList.selectors ", csscssAttributes[1].matchedCSSRules[0].rule.selectorList.selectors);

    //console.log("hrefLinks : ", linkAttributes);


    //console.log("other data : ", csscssAttributes);
    //const styleBalise = csscssAttributes
    //    .map(x => x.matchedCSSRules);

    // const uniqueStyleBalise = [{}];

    //for (var i = 0; i < styleBalise.length; i++){
    //  console.log("styleBalise : ",styleBalise[i]);
    //  for (var j = 0; j < styleBalise[i][1].rule.style.cssProperties.length; j++){
    //    uniqueStyleBalise.push(styleBalise[i][1].rule.style.cssProperties[j].name);
    //  }
    //}

    // Atrributes are returned in single array and item pairs
    // [..., "href", "www.example.com"]
    const hrefLinks = linkAttributes
        .map(x => x.attributes)
        .filter(x => x.includes("href"))
        .map((attrs) => {
            const index = attrs.indexOf("href");
            return attrs[index + 1];
        });

    //const cssLinks = cssAttributes
    //    .map(x => x.attributes)
    //    .filter(x => x.includes("href"))
    //    .map((attrs) => {
    //        const index = attrs.indexOf("href");
    //        return attrs[index + 1];
    //    });

    // Use set to get unique items only
    // uniqueCSSBalise = new Set([...uniqueStyleBalise]);
    // uniqueCSS = new Set([...cssLinks]);
    uniqueLinks = new Set([...hrefLinks]);


    //console.log("uniqueCSSBalise :", uniqueCSSBalise);

    return {
      "links" : uniqueLinks,
      "loaded-css" : loadedCSSstyles
      };
}

async function onClientHandler(client) {
    // Extract domains
    const { Network, CSS, DOM, Page, Runtime, Overlay } = client;

    Page.loadEventFired(() => {
        console.log("Load event fired");

        scrape(client)
            .then((links) => {
                //console.log(links);
                client.close();
            });
    });

    try {
        const websiteURL = "https://www.carteldelart.com/guide";

        await Promise.all([ Network.enable(), Page.enable(), DOM.enable(), CSS.enable() ]);
        const {frameId} = await Page.navigate({ url: websiteURL });
        const {styleSheetId} = await CSS.createStyleSheet({frameId});

    } catch (err) {
        console.error(err);
        client.close();
    }
};

CDP(onClientHandler)
.on("error", (err) => {
    console.error(err);
});
