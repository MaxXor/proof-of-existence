// Create an instance of the smart contract, passing it as a property, which allows web3js to interact with it
function Documents() {
    this.web3 = null;
    this.instance = null;
}

// Initialize the `Documents` object and create an instance of the web3js library
Documents.prototype.init = function() {
    // The initialization function defines the interface for the contract using
    // the web3js contract object and then defines the address of the instance
    // of the contract for the `Documents` object

    // Create a new Web3 instance using the Metamask provider
    if (typeof window.ethereum !== 'undefined') {
        var that = this;
        this.web3 = new Web3(ethereum);
        var contractAddress = '0x4B57233D6ce1560cDe194571Cd26dF1ffBb816a8';

        ethereum.enable().then(function (accounts) {
            // Create the contract instance for the specific address provided in the configuration
            that.instance = new that.web3.eth.Contract([{"constant":true,"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"documents","outputs":[{"internalType":"address","name":"submitter","type":"address"},{"internalType":"bytes32","name":"hash","type":"bytes32"},{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"}],"name":"addDocument","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}], contractAddress);
        }).catch(function (error) {
            console.log(error);
            $("#metamask-alert").show();
        });
    } else {
        $("#metamask-alert").show();
    }
};

// Gets the message value stored on the instance of the contract
Documents.prototype.getDocument = function(hash, cb) {
    this.instance.methods.documents(hash).call(function(error, result) {
        cb(error, result);
    });
};

// Submits the hash of a document on the instance of the contract
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

        that.web3.eth.getGasPrice(function(error, gasPrice) {
            if (error) {
                console.log(error);
                that.showLoader(false);
                $("#error-alert").show();
                return;
            }

            that.web3.eth.getAccounts(function(error, accounts) {
                if (error) {
                    console.log(error);
                    that.showLoader(false);
                    $("#error-alert").show();
                    return;
                }

                that.instance.methods.addDocument(hash).estimateGas({from: accounts[0]},
                    function(error, gasAmount) {
                        if (error) {
                            console.log(error);
                            that.showLoader(false);
                            $("#error-alert").show();
                            return;
                        }
    
                        that.instance.methods.addDocument(hash).send(
                            {
                                from: accounts[0],
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

// Resets the webpage alerts
Documents.prototype.resetAlerts = function() {
    $("#success-alert").hide();
    $("#submit-alert").hide();
    $("#existing-alert").hide();
    $("#notfound-alert").hide();
    $("#error-alert").hide();
};

// Sets the document hash for submission or search
Documents.prototype.setDocumentHash = function(evt) {
    var that = this;
    if (!window.File || !window.FileReader || !window.FileList) {
        console.log("File API not supported");
        return;
    }

    var fr = new FileReader();
    var input = evt.target;
    $('#file-input').next('.custom-file-label').html(input.files[0].name);

    fr.onload = function() {
        var hash = that.web3.utils.soliditySha3(fr.result);
        $("#hash").text(hash);
        $('#submit-button').prop('disabled', false);
        $('#search-button').prop('disabled', false);
    };

    fr.readAsText(input.files[0]);
};

// Searches the smart contract for a given document hash
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

        that.web3.eth.getBlock(result.blockNumber, function(error, block) {
            if (error) {
                console.log(error);
                $("#error-alert").show();
                return;
            }
            $("#blocknumber").text(`${new Date(block.timestamp*1000)} (Block number: ${result.blockNumber})`);
            $("#success-alert").show();
        });
    });
};

// Bind event handlers to the buttons defined in app.html
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

Documents.prototype.main = function() {
    this.resetAlerts();
};

Documents.prototype.onReady = function() {
    this.init();
    this.bindButton();
    this.main();
};

var documents = new Documents();

$(document).ready(function() {
    documents.onReady();
});
