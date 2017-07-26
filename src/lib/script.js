const CDP = require('chrome-remote-interface');

async = require('async');

CDP((client) => {
    // extract domains
    const {Network, Page} = client;

    // 1- get all links

    // 1-1 build site tree from document
    const getDOMOption = {
      depth: 2,
      pierce: false
    }
    
    client.DOM.getDocument(getDOMOption, (error, params) => {
      if (error){
        console.log("error getting DOM : ");
        return;
      }

      console.log("params : ", params.root.documentURL);

      // 1-2 get all href from document
      const options = {
          nodeId: params.root.nodeId,
          selector: 'a[href]'
      };

      client.DOM.querySelectorAll(options, (error, params) => {
          if (error) {
              console.error(params);
              return;
          }
          params.nodeIds.forEach((nodeId) => {
            const options = {
                nodeId: nodeId
            };

            client.DOM.getAttributes(options, (error, params) => {
              if (error) {
                  console.error(params);
                  return;
              }

              for (var i = 0; i < params.attributes.length; i++){
                if (bool){
                  console.log("href : ", params.attributes[i]);
                  bool = !bool;
                } else if (params.attributes[i] == "href"){
                    var bool = true;
                }
              }

              });
          });
      });

    })
    // get all CSS

    // get all used CSS

    // check used CSS

    // get element DOM

    Page.loadEventFired(() => {
        client.close();
    });
    // enable events then start!
    Promise.all([
        Network.enable(),
        Page.enable()
    ]).then(() => {
        return Page.navigate({url: 'https://www.carteldelart.com'});
    }).catch((err) => {
        console.error(err);
        client.close();
    });
}).on('error', (err) => {
    // cannot connect to the remote endpoint
    console.error(err);
});


// Function to print DOM with children
// *** Document URL, ChildNodeCount, [children]
const domToString = (s)  => {
  console.log("s : ", s);
  console.log("------------------------------------------------------------------");
  myStringResult = "{";
  if (s && s.children){
    myStringResult += s.documentURL+","+s.childNodeCount+",[";

      for (var i = 0; i < s.childNodeCount; i++){
        domToString(s.children[i]);
      }

    myStringResult += "]}"
  }
  console.log(myStringResult);
  return 0;
}
