// The object 'Contracts' is injected here, which contains all data for all contracts, keyed on contract name:
// Contracts['Documents'] = {
//  abi: [],
//  address: "0x..",
//  endpoint: "http://...."
// }

// Create an instance of the smart contract, passing it as a property,
// which allows web3js to interact with it.
function Documents(Contract) {
    this.web3 = null;
    this.instance = null;
    this.Contract = Contract;
}

// Initialize the `Documents` object and create an instance of the web3js library,
Documents.prototype.init = function() {
    // The initialization function defines the interface for the contract using
    // the web3js contract object and then defines the address of the instance
    // of the contract for the `Documents` object.

    // Create a new Web3 instance using either the Metamask provider
    // or an independent provider created as the endpoint configured for the contract.
    this.web3 = new Web3(
        (window.web3 && window.web3.currentProvider) ||
            new Web3.providers.HttpProvider(this.Contract.endpoint)
    );

    console.log(this.Contract.address);

    // Create the contract instance for the specific address provided in the configuration.
    this.instance = new this.web3.eth.Contract(this.Contract.abi, this.Contract.address);
};

// Gets the message value stored on the instance of the contract.
Documents.prototype.getDocument = function(hash, cb) {
    this.instance.methods.documents(hash).call(function(error, result) {
        cb(error, result);
    });
};

// Updates the message value on the instance of the contract.
Documents.prototype.submitHash = function() {
    var that = this;
    this.resetAlerts();
    var hash = $("#hash").text();
    this.showLoader(true);

    this.getDocument(hash, function(error, result) {
        if (error) {
            console.log(error);
            that.showLoader(false);
            $("#error-alert").show();
            return;
        }

        if (result.exists) {
            that.showLoader(false);
            $("#existing-alert").show();
            return;
        }

        that.web3.eth.getGasPrice(function(error, result) {
            if (error) {
                console.log(error);
                that.showLoader(false);
                $("#error-alert").show();
                return;
            }

            var gasPrice = result;

            that.instance.methods.addDocument(hash).estimateGas({from: window.web3.eth.accounts[0]},
                function(error, gasAmount) {
                    if (error) {
                        console.log(error);
                        that.showLoader(false);
                        $("#error-alert").show();
                        return;
                    }

                    that.instance.methods.addDocument(hash).send(
                        {
                            from: window.web3.eth.accounts[0],
                            gas: gasAmount,
                            gasPrice: gasPrice
                        },
                        function(error, txHash) {
                            if (error) {
                                console.log(error);
                                that.showLoader(false);
                                $("#error-alert").show();
                                return;
                            }

                            that.waitForReceipt(txHash, function(receipt) {
                                that.showLoader(false);
                                if (receipt.status) {
                                    console.log({ receipt });
                                    $("#submit-alert").show();
                                } else {
                                    console.log("transaction error");
                                    $("#error-alert").show();
                                }
                            });
                        }
                    );
                }
            );
        });
    });
};

// Waits for receipt of transaction
Documents.prototype.waitForReceipt = function(hash, cb) {
    var that = this;

    // Checks for transaction receipt using web3 library method
    this.web3.eth.getTransactionReceipt(hash, function(err, receipt) {
        if (err) {
            error(err);
        }
        if (receipt !== null) {
            // Transaction went through
            if (cb) {
                cb(receipt);
            }
        } else {
            // Try again in 2 second
            window.setTimeout(function() {
                that.waitForReceipt(hash, cb);
            }, 2000);
        }
    });
};

// Hide or show the loader when performing async operations
Documents.prototype.showLoader = function(show) {
    document.getElementById("loader").style.display = show ? "block" : "none";
    document.getElementById("submit-button").style.display = show ? "none" : "inline-block";
    document.getElementById("search-button").style.display = show ? "none" : "inline-block";
}

Documents.prototype.resetAlerts = function() {
    $("#success-alert").hide();
    $("#submit-alert").hide();
    $("#existing-alert").hide();
    $("#notfound-alert").hide();
    $("#error-alert").hide();
};

Documents.prototype.setDocumentHash = function(evt) {
    var that = this;
    if (!window.File || !window.FileReader || !window.FileList) {
        console.log("error");
    }

    var fr = new FileReader();
    var input = evt.target;

    fr.onload = function() {
        var hash = that.web3.utils.soliditySha3(fr.result);
        $("#hash").text(hash);
    };

    fr.readAsText(input.files[0]);
};

Documents.prototype.searchHash = function() {
    var that = this;
    this.resetAlerts();
    var hash = $("#hash").text();

    this.getDocument(hash, function(error, result) {
        if (error) {
            console.log(error);
            $("#error-alert").show();
            return;
        }

        if (!result.exists) {
            $("#notfound-alert").show();
            return;
        }

        that.web3.eth.getBlock(new that.web3.utils.BN(result.blockNumber), function(error, result) {
            if (error) {
                console.log(error);
                $("#error-alert").show();
                return;
            }
            $("#blocknumber").text(result.timestamp);
            $("#success-alert").show();
        });
    });
};

// Bind setMessage function to the button defined in app.html
Documents.prototype.bindButton = function() {
    var that = this;

    $(document).on("click", "#submit-button", function() {
        that.submitHash();
    });

    $(document).on("click", "#search-button", function() {
        that.searchHash();
    });

    $(document).on("change", "#file-input", function(evt) {
        that.setDocumentHash(evt);
    });
};

// JavaScript boilerplate to create the instance of the `Documents` object
// defined above, and show the HTML elements on the page:
Documents.prototype.main = function() {
    this.resetAlerts();
};

Documents.prototype.onReady = function() {
    this.init();
    this.bindButton();
    this.main();
};

if (typeof Contracts === "undefined")
    var Contracts = { Documents: { abi: [] } };
var documents = new Documents(Contracts["Documents"]);

$(document).ready(function() {
    documents.onReady();
});
