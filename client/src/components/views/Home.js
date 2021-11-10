import React from "react";
import $ from 'jquery';
import { CONSTANTS } from '../Constants';
import { 
    MDBBox, MDBContainer, MDBRow, MDBCol, MDBCard, MDBCardBody,
    MDBTable, MDBTableBody, MDBTableHead,
    MDBModal, MDBModalHeader, MDBModalBody,
    MDBDataTable, MDBIcon, MDBAnimation, MDBInput,
    MDBTabPane, MDBTabContent, MDBNav, MDBNavItem
} from "mdbreact";
import Moment from 'react-moment';
import moment from 'moment';
import Cookies from 'js-cookie'
import emailjs from 'emailjs-com';
import Lightbox from 'react-image-lightbox';
// import { ExportCSV } from './ExportCSV';

const guildImages = [
    '/assets/images/guides/buff_debuff.jpg',
    '/assets/images/guides/attack_details.jpg',
    '/assets/images/guides/battle_phase.jpeg',
    '/assets/images/guides/damange.jpg',
    '/assets/images/guides/scholar_guide_details.jpg',
    '/assets/images/guides/aventure_repeat.jpg',
    '/assets/images/guides/adventure_map.jpg',
    '/assets/images/guides/arena_slp_rewards_1.jpg',
    '/assets/images/guides/arena_slp_rewards_2.jpg'
];

class Home extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            error: false,
            isLoaded: false,
            isNotif: false,
            notifCat: "default",
            notifStr: "",
            isUser: this.props.user || "",
            isSponsorName: "",
            managerPHPInvestment: 339000, // Estimated Investment
            managerPHPROI: 0,
            managerPHPBreed: 0,
            managerPHPBuy: 0,
            managerPHPIncome: 0,
            managerPHPReachedROI: false,
            slpCurrentValue: 0,
            axsCurrentValue: 0,
            currentValueFrm: CONSTANTS.MESSAGE.COINGECKO,
            isRecordLoaded: false,
            isPlayerLoaded: false,
            playerRecords: [],
            playerDataTable: {},
            mmrDatatable: {},
            managerEarningDatatable: {},
            totalManagerClaimableSLP: 0,
            totalManagerSLP: 0,
            totalSponsorSLP: 0,
            totalScholarSLP: 0,
            totalInGameSLP: 0,
            totalAverageSLP: 0,
            isModalEarningOpen: false,
            modalEarningTitle: "",
            modalEarningFilter: "",
            modalEarningDetails: {},
            isModalMMRRankOpen: false,
            modalMMRRankDetails: [],
            isModalPlayerDetailsOpen: false,
            isModalIskoInputsOpen: false,
            modalPlayerDetails: [],
            topMMR: 0, // For condition of getting top user
            topSLP: 0, // For condition of getting top user
            topUserMMR: "",
            topUserSLP: "",
            isViewMangerEarning: CONSTANTS.MESSAGE.VIEW_CURRENT_EARNINGS,
            totalManagerAllSLP: 0,
            totalManagerAllPHP: 0,
            modalManagerAllEarning: [],
            photoIndex: 0,
            isLightBoxOpen: false,
            exportData: [],
            isValidAddTeam: 0,
            isValidWithdraw: 0,
            isValidManagerEarn: 0,
            errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
            PVPENERGY_DEFAULT: 20,
            tabIskoInputsActive: "1",
            slctClaimId: "",
            slctAddEditId: "",
            hasSponsor: false
        }
    }

    componentDidMount() {
        this.pageRefresh(120000); // Refresh in 2 minutes
        this.getCoingecko();
        // this.getBinance();
        this.getRecord();
    }

    // Adding comma in number x replacement in toLocaleString()
    numberWithCommas = (value) => {
        if (value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        return value;
    }

    // Modal Toggle for view of Manager and Sponsor's Earning
    modalEarningToggle = (title, filters, managerEarnings) => () => {
        const data = managerEarnings ? managerEarnings : [];
        this.setState({
            isModalEarningOpen: !this.state.isModalEarningOpen,
            modalEarningTitle: title,
            modalEarningFilter: filters,
            modalEarningDetails: data
        });
    }

    // Modal Toggle for view details of MMR Ranking
    modalMMRRankToggle = (playerDetails) => () => {
        this.setState({
            isModalMMRRankOpen: !this.state.isModalMMRRankOpen,
            modalMMRRankDetails: playerDetails
        });
    }

    // Modal Toggle for view of Players details
    modalPlayerDetailsToggle = (cliendId, playerDetails) => () => {
        let details = [];
        if (cliendId && playerDetails.length > 0) {
            const findDetail = playerDetails.find(items => items.client_id === cliendId);
            if (Object.keys(findDetail).length > 0) {
                details = [findDetail];
            }
        }

        this.setState({
            isModalPlayerDetailsOpen: !this.state.isModalPlayerDetailsOpen,
            modalPlayerDetails: details
        });
    }

    // Modal Toggle for adding new team
    modalIskoInputs = () => () => {
        this.setState({
            isModalIskoInputsOpen: !this.state.isModalIskoInputsOpen
        });
    }

    // Hide and Show Manager Total Earning
    onManagerEarningHandle(event) {
        if (event.target.innerText === CONSTANTS.MESSAGE.VIEW_ALL_EARNINGS) {
            this.setState({
                isViewMangerEarning: CONSTANTS.MESSAGE.VIEW_ALL_EARNINGS,
            })
        } else {
            this.setState({
                isViewMangerEarning: CONSTANTS.MESSAGE.VIEW_CURRENT_EARNINGS,
            })
        }
    }

    // Tabs Toggle for Scholar inputs
    tabsIskoInputs = tab => e => {
        if (this.state.tabIskoInputsActive !== tab) {
            this.setState({
                tabIskoInputsActive: tab
            });
        }
    };

    // Onchange checkbox if has sponsor in add/edit modal
    handleHasSponsorCheckChange(event) {
        this.setState({
            hasSponsor: event.target.checked
        })
    }

    // Page reload
    pageRefresh = (time) => {
        setTimeout( () => {
            if (!this.state.isModalIskoInputsOpen) { // Dont reload when other modal is open
                 return window.location.reload();
            }
            // Return
            return true;
        }, time);

        // Guide information button Bounce every 5 seconds
        setInterval(function() {
            $(".guides-btn").removeClass("bounce").removeAttr("style");
            setTimeout(function() {
                $(".guides-btn").addClass("bounce").css({"animation-name": "bounce", "visibility": "visible", "animation-iteration-count": "1"});
            }, 1000);
        }, 5000);
    }

    // API reload
    apiRefresh = () => {
        setTimeout(() => {
            // this.getCoingecko();
            // this.getBinance();
        }, 5000); // Refresh in 5 seconds
    }

    // Get Binance data / json
    getBinance = () => {
        // Get Current SLP and AXS Value
        $.ajax({
            url: "https://api.binance.com/api/v3/ticker/price",
            dataType: "json",
            cache: false,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        })
        .then(
            async (result) => {
                if (result.length > 0) {
                    let isSLPValue = 0, isAXSValue = 0;
                    result.map(items => {
                        // Get SLP value in Binance result
                        if (items.symbol === "SLPUSDT") {
                            isSLPValue = items.price;
                        }
                        // Get AXS value in Binance result
                        if (items.symbol === "AXSUSDT") {
                            isAXSValue = items.price;
                        }
                        // Return
                        return true;
                    });

                    // Get value of PHP
                    const currentPHPValue = await this.getPHPCurrentValue();
                    if (currentPHPValue.data) {
                        const valuePHP = currentPHPValue.data.rates.PHP;
                        if (valuePHP !== undefined) {
                            isSLPValue = (Math.floor(isSLPValue * valuePHP)).toFixed(2);
                            isAXSValue = (Math.floor(isAXSValue * valuePHP)).toFixed(2);
                        }
                    }
                            
                    this.setState({
                        currentValueFrm: CONSTANTS.MESSAGE.BINANCE,
                        slpCurrentValue: isSLPValue,
                        axsCurrentValue: isAXSValue
                    })
                } else {
                    // Get Coingecko data / json
                    this.getCoingecko();
                    this.setState({
                        currentValueFrm: CONSTANTS.MESSAGE.COINGECKO
                    })
                }
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                // Get Coingecko data / json
                this.getCoingecko();
                this.setState({
                    currentValueFrm: CONSTANTS.MESSAGE.COINGECKO
                })
                    
                console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
            }
        )
        .catch(
            (err) => {
                // Get Coingecko data / json
                this.getCoingecko();
                this.setState({
                    currentValueFrm: CONSTANTS.MESSAGE.COINGECKO
                })
                    
                console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
            }
        )
        .done(() => {
            // Refresh API
            this.apiRefresh();
        })
    }
    
    // Get Coingecko data / json
    getCoingecko = () => {
        // Get Current SLP and AXS Value
        $.ajax({
            url: "https://api.coingecko.com/api/v3/simple/price?ids=smooth-love-potion,axie-infinity&vs_currencies=php",
            dataType: "json",
            cache: false
        })
        .then(
            (result) => {
                this.setState({
                    slpCurrentValue: result["smooth-love-potion"].php,
                    axsCurrentValue: result["axie-infinity"].php
                })
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                this.setState({
                    isLoaded: true,
                    isNotif: true,
                    notifCat: "error",
                    notifStr: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                    error: true
                })
                    
                console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
            }
        )
        .catch(
            (err) => {
                this.setState({
                    isLoaded: true,
                    isNotif: true,
                    notifCat: "error",
                    notifStr: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                    error: true
                })
                    
                console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
            }
        )
        .done(() => {
            // Refresh API
            this.apiRefresh();
        })
    }

    // Get frankfurter data / json
    getPHPCurrentValue = async () => {
        return new Promise((resolve, reject) => {
            // Get Current PHP Value
            $.ajax({
                url: "https://api.frankfurter.app/latest?from=USD",
                dataType: "json",
                cache: false
            })
            .then(
                (result) => {
                    return resolve({data: result});
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    return reject({error: error})
                }
            )
            .catch(
                (err) => {
                    return reject({error: err})
                }
            )
        }).catch(err => {
            console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
            return err;
        });
    }

    // Send Email Message for lower MMR
    sendMMRMessage = (name, email, mmr, message) => {
        if (name && email && mmr) {
            // EDM Content
            const eDMData = {
                service_id: "gmail",
                template_id: "template_gwqFwjqA",
                template_params: {
                    "from_name": name,
                    "to_email": email,
                    "subject": CONSTANTS.MESSAGE.EMAIL_LOWMMR_SUBJECT,
                    "message": message,
                    "mmr": this.numberWithCommas(mmr)
                },
                user_id: "user_DKcMwG40VRnkIFionziRA"
            }

            // Get cookie if already sent an email x single send every browser open x based on cookies
            const sendMMREmail = Cookies.get("sendMMREmail");
            if (sendMMREmail && sendMMREmail !== undefined) {
                // Check if already sent an email x if not, send email
                const checker = sendMMREmail.split(",");
                if (checker && checker !== undefined && !checker.includes(name)) {
                    // Send email x not exist in cookie
                    this.sendEmail(eDMData);
                    // Add new name in cookie
                    Cookies.set("sendMMREmail", [checker, name]);
                }
            } else {
                // Send email if not exist in cookie
                this.sendEmail(eDMData);
                // Add new name in cookie
                Cookies.set("sendMMREmail", [name]);
            }
        }
    }

    // Run ajax for sending email
    sendEmail = (eDMData) => {
        emailjs.send(eDMData.service_id, eDMData.template_id, eDMData.template_params, eDMData.user_id)
        .then(function(response) {
            // Sent successful
            console.log('Message successfully sent!', eDMData.template_params.from_name, response.status, response.text);
        }, function() {
            // Send Email via Ajax
            $.ajax({
                url: "https://api.emailjs.com/api/v1.0/email/send",
                type: 'POST',
                data: JSON.stringify(eDMData),
                contentType: 'application/json',
                cache: false
            })
            .then(
                (result) => {
                    // Sent successful
                    console.log('Message successfully sent!', eDMData.template_params.from_name, result.status, result.text);
                },
                (error) => {
                    console.error('Oh well, you failed. Here some thoughts on the error that occured:', error)
                }
            )
            .catch(
                (err) => {
                    console.error('Oh well, you failed. Here some thoughts on the error that occured:', err)
                }
            )
        });
    }

    // Handle for onchange select of Add/Edit Scholar
    handleAddEditIskoChange(event) {
        this.setState({
            slctAddEditId: event.target.value
        })

        if (event.target.value) {
            // Update Select Option text
            // $(".addEdit-inputHolder").find("select").text(`${CONSTANTS.MESSAGE.EDIT}: ${event.target.value}`);
            const dataSet = this.state.playerRecords.filter(item => item.cliend_id === event.target.value || item.name === event.target.value); // Filter valid data
            if (dataSet.length > 0) {
                // Check if item has sponsor
                if (Number(dataSet[0].details.SHR_SPONSOR) > 0) {
                    this.setState({
                        hasSponsor: true
                    })
                } else {
                    this.setState({
                        hasSponsor: false
                    })
                }
                // Update input fields
                $(".addEdit-inputHolder input[name=ADDRESS]").val(dataSet[0].details.ADDRESS).attr("value", dataSet[0].details.ADDRESS).trigger("change");
                $(".addEdit-inputHolder input[name=NAME]").val(dataSet[0].details.NAME).attr("value", dataSet[0].details.NAME).trigger("change");
                $(".addEdit-inputHolder input[name=EMAIL]").val(dataSet[0].details.EMAIL).attr("value", dataSet[0].details.EMAIL).trigger("change");
                $(".addEdit-inputHolder input[name=SHR_MANAGER]").val(dataSet[0].details.SHR_MANAGER).attr("value", dataSet[0].details.SHR_MANAGER).trigger("change");
                $(".addEdit-inputHolder input[name=SHR_SCHOLAR]").val(dataSet[0].details.SHR_SCHOLAR).attr("value", dataSet[0].details.SHR_SCHOLAR).trigger("change");

                // Timeout the function for update the value from hidden previous
                setTimeout( () => {
                    $(".addEdit-inputHolder input[name=SHR_SPONSOR]").val(dataSet[0].details.SHR_SPONSOR).attr("value", dataSet[0].details.SHR_SPONSOR).trigger("change");
                    $(".addEdit-inputHolder input[name=SPONSOR_NAME]").val(dataSet[0].details.SPONSOR_NAME).attr("value", dataSet[0].details.SPONSOR_NAME).trigger("change");
                }, 500);
            } else {
                this.setState({
                    hasSponsor: false
                })
                // Clear data in input fields
                $(".addEdit-inputHolder input[name=ADDRESS]").val("").trigger("change");
                $(".addEdit-inputHolder input[name=NAME]").val("").trigger("change");
                $(".addEdit-inputHolder input[name=EMAIL]").val("").trigger("change");
                $(".addEdit-inputHolder input[name=SHR_MANAGER]").val("").trigger("change");
                $(".addEdit-inputHolder input[name=SHR_SCHOLAR]").val("").trigger("change");
                $(".addEdit-inputHolder input[name=SHR_SPONSOR]").val("").trigger("change");
                $(".addEdit-inputHolder input[name=SPONSOR_NAME]").val("").trigger("change");
            }
        } else {
            this.setState({
                hasSponsor: false
            })
            // Clear data in input fields
            $(".addEdit-inputHolder input[name=ADDRESS]").val("").trigger("change");
            $(".addEdit-inputHolder input[name=NAME]").val("").trigger("change");
            $(".addEdit-inputHolder input[name=EMAIL]").val("").trigger("change");
            $(".addEdit-inputHolder input[name=SHR_MANAGER]").val("").trigger("change");
            $(".addEdit-inputHolder input[name=SHR_SCHOLAR]").val("").trigger("change");
            $(".addEdit-inputHolder input[name=SHR_SPONSOR]").val("").trigger("change");
            $(".addEdit-inputHolder input[name=SPONSOR_NAME]").val("").trigger("change");
        }
    }

    // Handle for saving record
    onAddEditRecordHandle(event) {
        event.preventDefault();
        // Remove error message
        this.setState({
            isValidAddTeam: 0,
            isLoaded: false,
            isModalIskoInputsOpen: false // Close modal while processing
        })

        const shrManager = event.target.SHR_MANAGER.value ? event.target.SHR_MANAGER.value : "0";
        const shrScholar = event.target.SHR_SCHOLAR.value ? event.target.SHR_SCHOLAR.value : "0";
        const shrSponsor = event.target.SHR_SPONSOR ? event.target.SHR_SPONSOR.value ? event.target.SHR_SPONSOR.value : "0" : "0";
        const shareTotal = Number(shrManager) + Number(shrScholar) + Number(shrSponsor);
        const dateToday = moment().format("YYYY-MM-DD HH:mm:ss");
        if (shareTotal === 100) {
            const sponsorName = Number(shrManager) + Number(shrScholar) === 100 ? "" : event.target.SPONSOR_NAME ? event.target.SPONSOR_NAME.value ? event.target.SPONSOR_NAME.value : "" : "";
            // Continue with the process
            const datas = {
                ADDRESS: event.target.ADDRESS.value,
                NAME: event.target.NAME.value,
                EMAIL: event.target.EMAIL.value,
                SHR_MANAGER: shrManager,
                SHR_SCHOLAR: shrScholar,
                SHR_SPONSOR: shrSponsor,
                SPONSOR_NAME: sponsorName,
                STARTED_ON: dateToday,
                ACTION: this.state.slctAddEditId ? CONSTANTS.MESSAGE.UPDATE : CONSTANTS.MESSAGE.INSERT // Empty addEdit id from select will be insert
            }

            // Run Ajax
            $.ajax({
                url: "/api/addEditScholar",
                type: "POST",
                data: JSON.stringify(datas),
                contentType: 'application/json',
                cache: false,
            }).then(
                async (result) => {
                    // Return
                    if (!result.error) {
                        // Sucess response x reload the page
                        window.location.reload();
                    } else {
                        // Has error
                        this.setState({
                            isValidAddTeam: false,
                            errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                            isLoaded: true,
                            isModalIskoInputsOpen: true // Open modal after processing with error
                        })
                    }
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
                    this.setState({
                        isValidAddTeam: false,
                        errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                        isLoaded: true,
                        isModalIskoInputsOpen: true // Open modal after processing with error
                    })
                }
            )
            .catch(
                (err) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
                    this.setState({
                        isValidAddTeam: false,
                        errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                        isLoaded: true,
                        isModalIskoInputsOpen: true // Open modal after processing with error
                    })
                }
            )
        } else {
            // Invalid total of Share
            this.setState({
                isValidAddTeam: false,
                errorMsg: CONSTANTS.MESSAGE.SHARELIMIT,
                isLoaded: true,
                isModalIskoInputsOpen: true // Open modal after processing with error
            })
        }
    }

    // Handle for Select Change in Claim Tab
    handleClaimChange(event) {
        this.setState({
            slctClaimId: event.target.value
        })

        // Update SLP Currency input value
        $(".claim-inputHolder input[name=SLPCURRENCY]").val(this.state.slpCurrentValue).attr("value", this.state.slpCurrentValue).trigger("change");
        // Continue with the process
        if (event.target.value) {
            const dataSet = this.state.playerRecords.filter(item => item.cliend_id === event.target.value || item.name === event.target.value); // Filter valid data
            if (dataSet.length > 0) {
                // Update input fields
                $(".claim-inputHolder input[name=ADDRESS]").val(dataSet[0].details.ADDRESS).attr("value", dataSet[0].details.ADDRESS).trigger("change").siblings('label').addClass('active');
                $(".claim-inputHolder input[name=SHR_MANAGER]").val(dataSet[0].sharedManagerSLP).attr("value", dataSet[0].sharedManagerSLP).trigger("change");
                $(".claim-inputHolder input[name=SHR_SCHOLAR]").val(dataSet[0].scholarSLP).attr("value", dataSet[0].scholarSLP).trigger("change");
                $(".claim-inputHolder input[name=SHR_SPONSOR]").val(dataSet[0].sharedSponsorSLP).attr("value", dataSet[0].sharedSponsorSLP).trigger("change");
                // Enable Button Submit
                $(".claim-inputHolder button").removeAttr("disabled");
            } else {
                // Clear data in input fields
                $(".claim-inputHolder input[name=ADDRESS]").val("").trigger("change").siblings('label').removeClass('active');
                $(".claim-inputHolder input[name=SHR_MANAGER]").val("").trigger("change");
                $(".claim-inputHolder input[name=SHR_SCHOLAR]").val("").trigger("change");
                $(".claim-inputHolder input[name=SHR_SPONSOR]").val("").trigger("change");
                // Disabled Button Submit
                $(".claim-inputHolder button").attr("disabled", "disabled");
            }
        } else {
            // Clear data in input fields
            $(".claim-inputHolder input[name=ADDRESS]").val("").trigger("change");
            $(".claim-inputHolder input[name=SHR_MANAGER]").val("").trigger("change");
            $(".claim-inputHolder input[name=SHR_SCHOLAR]").val("").trigger("change");
            $(".claim-inputHolder input[name=SHR_SPONSOR]").val("").trigger("change");
            // Disabled Button Submit
            $(".claim-inputHolder button").attr("disabled", "disabled");
        }
    }

    // Handle for saving withdraw slp
    onWithdrawHandle(event) {
        event.preventDefault();
        // Remove error message
        this.setState({
            isValidWithdraw: 0,
            isLoaded: false,
            isModalIskoInputsOpen: false // Close modal while processing
        })

        const roninAddress = event.target.ADDRESS.value ? event.target.ADDRESS.value : "";
        const shrManager = event.target.SHR_MANAGER.value ? event.target.SHR_MANAGER.value : "0";
        const shrScholar = event.target.SHR_SCHOLAR.value ? event.target.SHR_SCHOLAR.value : "0";
        const shrSponsor = event.target.SHR_SPONSOR.value ? event.target.SHR_SPONSOR.value : "0";
        const slpCurrency = Number(event.target.SLPCURRENCY.value) && Number(event.target.SLPCURRENCY.value) !== 0 ? event.target.SLPCURRENCY.value : this.state.slpCurrentValue;
        const withdrawOn = event.target.WITHDRAW_ON.value ? moment(event.target.WITHDRAW_ON.value).format("YYYY-MM-DD HH:mm:ss") : moment().format("YYYY-MM-DD HH:mm:ss");
        if ((Number(shrManager) > 0 || Number(shrScholar) > 0 || Number(shrSponsor) > 0) && roninAddress) {
            // Continue with the process
            const datas = {
                ADDRESS: roninAddress,
                SHR_MANAGER: shrManager,
                SHR_SCHOLAR: shrScholar,
                SHR_SPONSOR: shrSponsor,
                SLPCURRENCY: slpCurrency,
                WITHDRAW_ON: withdrawOn
            }

            // Run api
            $.ajax({
                url: "/api/withdraw",
                type: "POST",
                data: JSON.stringify(datas),
                contentType: 'application/json',
                cache: false,
            }).then(
                async (result) => {
                    // Return
                    if (!result.error) {
                        // Sucess response x reload the page
                        window.location.reload();
                    } else {
                        // Has error
                        this.setState({
                            isValidWithdraw: false,
                            errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                            isLoaded: true,
                            isModalIskoInputsOpen: true // Open modal after processing with error
                        })
                    }
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
                    // Has error
                    this.setState({
                        isValidWithdraw: false,
                        errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                        isLoaded: true,
                        isModalIskoInputsOpen: true // Open modal after processing with error
                    })
                }
            )
            .catch(
                (err) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
                    // Has error
                    this.setState({
                        isValidWithdraw: false,
                        errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                        isLoaded: true,
                        isModalIskoInputsOpen: true // Open modal after processing with error
                    })
                }
            )
        } else {
            // Invalid data
            this.setState({
                isValidAddTeam: false,
                errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                isLoaded: true,
                isModalIskoInputsOpen: true // Open modal after processing with error
            })
        }
    }

    // Handle for saving manager earnings
    onManagerEarnedHandle(event) {
        event.preventDefault();
        // Remove error message
        this.setState({
            isValidManagerEarn: 0,
            isLoaded: false,
            isModalIskoInputsOpen: false // Close modal while processing
        })

        const slpTotal = event.target.SLPTOTAL.value ? event.target.SLPTOTAL.value : "0";
        const slpCurrency = Number(event.target.SLPCURRENCY.value) && Number(event.target.SLPCURRENCY.value) !== 0 ? event.target.SLPCURRENCY.value : this.state.slpCurrentValue;
        const category = $(".managerEarn-inputHolder").find("select option:selected").text();
        const earnedOn = event.target.EARNED_ON.value ? moment(event.target.EARNED_ON.value).format("YYYY-MM-DD HH:mm:ss") : moment().format("YYYY-MM-DD HH:mm:ss");
        if (Number(slpTotal) > 0 && Number(slpCurrency) > 0 && category) {
            // Continue with the process
            const datas = {
                SLPTOTAL: slpTotal,
                SLPCURRENCY: slpCurrency,
                CATEGORY: category,
                EARNED_ON: earnedOn
            }
                
            // Run api
            $.ajax({
                url: "/api/managerEarned",
                type: "POST",
                data: JSON.stringify(datas),
                contentType: 'application/json',
                cache: false,
            }).then(
                async (result) => {
                    // Return
                    if (!result.error) {
                        // Sucess response x reload the page
                        window.location.reload();
                    } else {
                        // Has error
                        this.setState({
                            isValidManagerEarn: false,
                            errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                            isLoaded: true,
                            isModalIskoInputsOpen: true // Open modal after processing with error
                        })
                    }
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
                    // Has error
                    this.setState({
                        isValidManagerEarn: false,
                        errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                        isLoaded: true,
                        isModalIskoInputsOpen: true // Open modal after processing with error
                    })
                }
            )
            .catch(
                (err) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
                    // Has error
                    this.setState({
                        isValidManagerEarn: false,
                        errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                        isLoaded: true,
                        isModalIskoInputsOpen: true // Open modal after processing with error
                    })
                }
            )
        } else {
            // Invalid data
            this.setState({
                isValidAddTeam: false,
                errorMsg: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                isLoaded: true,
                isModalIskoInputsOpen: true // Open modal after processing with error
            })
        }
    }

    // Update Daily SLP
    dailySLPAPI = async (datas) => {
        // Run api
        $.ajax({
            url: "/api/dailySLP",
            type: "POST",
            data: JSON.stringify(datas),
            contentType: 'application/json',
            cache: false,
        }).then(
            async (result) => {
                console.log("dailySLPAPI", result)
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
            }
        )
        .catch(
            (err) => {
                console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
            }
        )
    }
    
    // Fetch Player Record Data
    getRecord = () => {
        $.ajax({
            url: "/api/records",
            type: "GET",
            contentType: 'application/json',
            cache: false,
        })
        .then(
            async (response) => {
                const dataRecords = response.data;
                const dataWithdraw = response.withdraw;
                const dataManagerEarned = response.managerEarned;
                console.log("result", response)
                if (dataRecords.length > 0) {
                    // Fetch player details in api of sky mavis
                    const dataResultPromise = dataRecords.map(async (item) => {
                        const ethAddress = item.ADDRESS ? `0x${item.ADDRESS.substring(6)}` : "";
                        let userEthAddress = null;
                        const iSponsorName = item.SPONSOR_NAME ? item.SPONSOR_NAME.toLowerCase() : ""

                        if (item.EMAIL.toLowerCase() === this.state.isUser.toLowerCase() ||
                            item.NAME.toLowerCase() === this.state.isUser.toLowerCase() ||
                            iSponsorName === this.state.isUser.toLowerCase()) {
                                // Get ETH Address based on Credential
                                userEthAddress = ethAddress;
                                if (item.SHR_SPONSOR !== "" || item.SHR_SPONSOR !== "0" || item.SHR_SPONSOR !== undefined) {
                                    // Set valid Sponsor Name
                                    this.setState({
                                        isSponsorName: this.state.isUser
                                    })
                                }
                        }

                        // Return
                        return await this.getPlayerDetails(item, ethAddress, userEthAddress, dataWithdraw, dataManagerEarned);
                    });

                    await Promise.all(dataResultPromise).then(async (results) => {
                        let initDisplay = []; // Data for initial display
                        let mmrDisplay = []; // Data for players MMR list display in Modal
                        let managerEarningsDisplay = []; // Data for Manager Earnings in Modal
                        let disExportData = []; // Data to be exported
                        let daialySLPData = [] // Data to be pass in DailySLP API

                        const dataResult = results.filter(item => !item.error && item.data !== undefined && item.eth !== undefined); // Filter valid data
                        if (dataResult && dataResult.length > 0) {
                            // Sort as Top MMR Ranking
                            dataResult.sort(function (a, b) {
                                if (a.rank === b.rank) { // equal items sort equally
                                    return 0;
                                } else if (a.rank === 0) { // 0 sort after anything else
                                    return 1;
                                } else if (b.rank === 0) { // 0 sort after anything else
                                    return -1;
                                } else {  // otherwise, if we're ascending, lowest sorts first
                                    return a.rank < b.rank ? -1 : 1;
                                }
                              }).map((dataItem, index) => {
                                dataItem.data.order = index + 1; // Adding ordered number

                                // Get Top MMR Player
                                if (dataItem.data.order === 1) {
                                    this.setState({
                                        topUserMMR: dataItem.data.nameMmr ? dataItem.data.nameMmr : ""
                                    })
                                }
    
                                // Display data
                                if (this.state.isUser === CONSTANTS.MESSAGE.MANAGER) {
                                    initDisplay.push(dataItem.data); // Data for initial display x display all
                                } else {
                                    if (dataItem.eth !== null) {
                                        initDisplay.push(dataItem.data); // Data for initial display x specific data to be display
                                    }
                                }
    
                                // Data for players MMR list display in Modal x Pushed specific data
                                mmrDisplay.push({
                                    order: dataItem.data.order,
                                    name: dataItem.data.name,
                                    mmr: dataItem.data.mmr,
                                    rank: dataItem.data.rank
                                });

                                // Data for Daily SLP
                                if (dataItem.dailySLPwillSave) {
                                    daialySLPData.push(dataItem.dailySLP);
                                }
    
                                // Return
                                return true;
                            });
    
                            // Sort as Top SLP Gainer
                            dataResult.sort((a, b) =>  b.slp - a.slp ).map((dataItem, index) => {
                                dataItem.data.order = index + 1; // Adding ordered number
    
                                // Get Top InGame SLP Player
                                if (dataItem.data.order === 1) {
                                    this.setState({
                                        topUserSLP: dataItem.data.nameInGameSLP ? dataItem.data.nameInGameSLP : ""
                                    })
                                }

                                // Display data
                                if (this.state.isUser === CONSTANTS.MESSAGE.MANAGER) {
                                    // Data for Manager Earnings in Modal x Pushed specific data
                                    managerEarningsDisplay.push({
                                        name: dataItem.data.name,
                                        ingameSLP: dataItem.data.ingameSLP,
                                        sharedManagerSLP: dataItem.data.sharedManagerSLP,
                                        managerEarningsPHP: dataItem.data.managerEarningsPHP
                                    });
                                }

                                // Get the data to be export
                                if (dataItem.export !== undefined && Object.keys(dataItem.export).length > 0) {
                                    disExportData.push(dataItem.export);
                                }
    
                                // Return
                                return true;
                            });

                            // Adding body document if the playerDataTableis single data x initDisplay
                            if (initDisplay.length <= 1) {
                                document.body.classList.add('single-player-datatable-handler');
                            }

                            // Run Daily SLP API x Save cookie
                            if (daialySLPData.length > 0) {
                                this.dailySLPAPI(daialySLPData);
                            }
    
                            // Return data x Set state
                            this.setState({
                                isLoaded: true,
                                isPlayerLoaded: true,
                                playerDataTable: {
                                    columns: [
                                        {label: CONSTANTS.MESSAGE.NAME, field: "name"},
                                        {label: CONSTANTS.MESSAGE.DAILYSLP, field: "dailySLP"},
                                        {label: CONSTANTS.MESSAGE.INGAME_SLP, field: "ingameSLP"},
                                        {label: CONSTANTS.MESSAGE.SHARED_SLP, field: "sharedScholarSLP"},
                                        {label: CONSTANTS.MESSAGE.RONIN_SLP, field: "roninSLP"},
                                        {label: CONSTANTS.MESSAGE.TOTAL_SLP, field: "totalScholarEarningSLP"},
                                        {label: CONSTANTS.MESSAGE.EARNINGS_PHP, field: "totalScholarEarningPHP"},
                                        {label: CONSTANTS.MESSAGE.CLAIMON, field: "claimOn"},
                                        {label: CONSTANTS.MESSAGE.PVP_ENERGY, field: "pvpEnergy"},
                                        {label: CONSTANTS.MESSAGE.MMR, field: "mmrRank"}
                                    ], rows: initDisplay
                                },
                                mmrDatatable: {
                                    columns: [
                                        {label: "", field: "order"},
                                        {label: CONSTANTS.MESSAGE.NAME, field: "name"},
                                        {label: CONSTANTS.MESSAGE.MMR, field: "mmr"},
                                        {label: CONSTANTS.MESSAGE.RANK, field: "rank", sort: "desc"}
                                    ], rows: mmrDisplay
                                },
                                managerEarningDatatable: {
                                    columns: [
                                        {label: CONSTANTS.MESSAGE.NAME, field: "name"},
                                        {label: CONSTANTS.MESSAGE.INGAME_SLP, field: "ingameSLP"},
                                        {label: CONSTANTS.MESSAGE.SHARED_SLP, field: "sharedManagerSLP"},
                                        {label: CONSTANTS.MESSAGE.EARNINGS_PHP, field: "managerEarningsPHP"}
                                    ], rows: managerEarningsDisplay
                                },
                                exportData: disExportData
                            })
    
                            console.log("playerRecords", this.state.playerRecords)
                        } else {
                            // No data found
                            this.setState({
                                isLoaded: true,
                                isNotif: true,
                                notifCat: "error",
                                notifStr: CONSTANTS.MESSAGE.NODATA_FOUND,
                                error: true
                            })
                        }
                    })
                } else {
                    // No data found
                    this.setState({
                        isLoaded: true,
                        isNotif: true,
                        notifCat: "error",
                        notifStr: CONSTANTS.MESSAGE.NODATA_FOUND,
                        error: true
                    })
                }
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                this.setState({
                    isLoaded: true,
                    isNotif: true,
                    notifCat: "error",
                    notifStr: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                    error: true
                })
                    
                console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
            }
        )
        .catch(
            (err) => {
                this.setState({
                    isLoaded: true,
                    isNotif: true,
                    notifCat: "error",
                    notifStr: CONSTANTS.MESSAGE.UNEXPECTED_ERROR,
                    error: true
                })
                    
                console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
            }
        )
    }

    // Get Player details base on Sky Mavis API
    getPlayerDetails = async (details, ethAddress, userEthAddress, dataWithdraw, dataManagerEarned) => {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "https://game-api.skymavis.com/game-api/clients/" + ethAddress + "/items/1",
                dataType: "json",
                cache: false
            })
            .then(
                async (result) => {
                    if (Object.keys(result).length > 0) { // Has player details
                        // Get Player ranking base on Sky Mavis API
                        const ranking = await this.getPlayerRanking(ethAddress);
                        // Get Player battle log base on Game API Axie Technology
                        const battleLogs = await this.getPlayerBattleLog(details.ADDRESS, ethAddress, this.state.PVPENERGY_DEFAULT);

                        if (ranking.error) {
                            // Default object for ranking
                            ranking.name = "";
                            ranking.elo = 0;
                            ranking.rank = 0;
                            ranking.win_total = 0;
                            ranking.lose_total = 0;
                            ranking.draw_total = 0;
                            ranking.win_rate = 0;
                            ranking.textStyle = "";
                            ranking.eloStatus = "";
                        } else {
                            // Adding text color of MMR based on MMR level
                            if (ranking.elo < 1300 && ranking.elo >= 1100) {
                                // Estimated SLP gain on this MRR (6SLP) x Set as warning need to up
                                ranking.textStyle = "orange-text";
                                ranking.eloStatus = "warning";
                            } else if (ranking.elo < 1099) {
                                // Estimated SLP gain on this MRR (3SLP, 1SLP or NOSLP) x Set as warning need to up
                                ranking.textStyle = "red-text font-weight-bold";
                                ranking.eloStatus = "danger";
                            } else {
                                // Great MMR x Can earn more SLP
                                ranking.textStyle = "green-text";
                                ranking.eloStatus = "success";
                            }
                        }

                        // Creating object
                        let roninBalance = 0, managerSLPClaimed = 0;
                        result.name = ranking.name ? ranking.name : "";
                        result.last_claimed_item_at_add = moment.unix(result.last_claimed_item_at).add(1, 'days');
                        result.claim_on_days = 0;
                        result.inGameSLP = result.total;
                        result.totalScholarEarningSLP = result.total;
                        result.averageSLPDay = 0;
                        result.sharedManagerSLP = 0;
                        result.sharedSponsorSLP = 0;
                        result.pvp_energy = this.state.PVPENERGY_DEFAULT !== undefined ? this.state.PVPENERGY_DEFAULT + "/" + this.state.PVPENERGY_DEFAULT : "20/20"; // 20 is Default energy
                        result.managerRoninClaimed = false;

                        // Set new value for Claim On (Days) x last_claimed_item_at_add - current date
                        const lastClaimedDate = new Date(moment.unix(result.last_claimed_item_at)).getTime();
                        const currentDate = new Date().getTime();
                        if (currentDate > lastClaimedDate) {
                            result.claim_on_days = Math.round((currentDate - lastClaimedDate) / (1000 * 3600 * 24)).toFixed(0);
                        }

                        if (result.blockchain_related === null || result.blockchain_related.signature === null) {
                            // Adding empty object
                            result.blockchain_related.signature = {
                                amount: 0,
                                timestamp: ""
                            }
                        }

                        result.sharedScholarSLP = result.inGameSLP;
                        result.scholarSLP = result.inGameSLP;
                        if (Object.keys(details).length > 0) {
                            // Update name if the orig name is empty
                            result.name = details.NAME ? details.NAME : result.name ? result.name : ethAddress;

                            // Check if has balance in Ronin x Set new value for total in game slp
                            if (result.blockchain_related.balance !== null && result.blockchain_related.balance > 0) {
                                roninBalance = result.blockchain_related.balance;
                                result.inGameSLP = result.total - roninBalance;
                            }

                            if ((details.SHR_MANAGER).toString() === "100" || details.SHR_MANAGER > 0) { // Condition for Manager Share
                                // Set new Shared SLP
                                const managerShare = (details.SHR_MANAGER).toString() === "100" ? 1 : "0." + details.SHR_MANAGER;
                                result.sharedManagerSLP = Math.ceil(result.inGameSLP * managerShare);

                                if ((details.SHR_MANAGER).toString() === "100") {
                                    // Set new Shared SLP
                                    result.scholarSLP = 0;
                                    if (roninBalance > result.total) {
                                        result.sharedScholarSLP = Math.ceil(roninBalance - result.total);
                                    } else {
                                        result.sharedScholarSLP = Math.ceil(result.total - roninBalance);
                                    }

                                    // Adding ronin balance in total Manage SLP x // Set new Total Manager's Earning
                                    this.setState({
                                        totalManagerSLP: this.state.totalManagerSLP + result.sharedManagerSLP
                                    })

                                    // Set new Total Manager Claimable SLP
                                    if (Number(result.claim_on_days) >= 14) {
                                        this.setState({
                                            totalManagerClaimableSLP: this.state.totalManagerClaimableSLP + result.sharedManagerSLP + roninBalance
                                        })
                                    } else {
                                        this.setState({
                                            totalManagerClaimableSLP: this.state.totalManagerClaimableSLP + roninBalance
                                        })
                                    }
                                } else {
                                    // Set new Total Manager's Earning
                                    if (details.managerDebtClaimed === undefined || details.managerDebtClaimed <= 0) {
                                        this.setState({
                                            totalManagerSLP: this.state.totalManagerSLP + result.sharedManagerSLP
                                        })
                                    }
                                    
                                    // Set new Total Manager Claimable SLP
                                    if (Number(result.claim_on_days) >= 14) {
                                        this.setState({
                                            totalManagerClaimableSLP: this.state.totalManagerClaimableSLP + result.sharedManagerSLP
                                        })
                                    }
                                }
                            }

                            if ((details.SHR_SPONSOR).toString() !== "0" || details.SHR_SPONSOR > 0) { // Condition for Sponsor
                                // Set new Shared SLP
                                const sponsorShare = "0." + details.SHR_SPONSOR;
                                result.sharedSponsorSLP = Math.floor(result.inGameSLP * sponsorShare);

                                // Set new Total Sponsor's Earning
                                this.setState({
                                    totalSponsorSLP: this.state.totalSponsorSLP + result.sharedSponsorSLP
                                })
                            }

                            if ((details.SHR_SCHOLAR).toString() !== "0" || details.SHR_SCHOLAR > 0) { // Condition for Scholar Players
                                // Set new Shared SLP
                                const iskoShare = (details.SHR_SCHOLAR).toString() === "100" ? 1 : "0." + details.SHR_SCHOLAR;
                                result.sharedScholarSLP = Math.floor(result.inGameSLP * iskoShare);
                                result.scholarSLP = Math.floor(result.inGameSLP * iskoShare);
                            }

                            // Set new value for Team Total Income and Total Earning per withdraw
                            details.withdrawEarning = []; // Default value of withdraw earning
                            details.totalIncome = 0; // Default value of Total Income
                            if (dataWithdraw !== undefined && dataWithdraw.length > 0) {
                                // Get specific data based on ronin address in dataWithdraw
                                dataWithdraw.filter(item => item.ADDRESS === details.ADDRESS).map(data => {
                                    const createObj = {}; // Create Temp Obeject
                                    createObj.slp = (details.SHR_MANAGER).toString() === "100" ? data.SHR_MANAGER : data.SHR_SCHOLAR;
                                    createObj.slpPrice = data.SLPCURRENCY;
                                    createObj.date = data.WITHDRAW_ON;
                                    createObj.earning = Number(createObj.slp) * Number(createObj.slpPrice);
                                    // Update Total Income
                                    details.totalIncome = details.totalIncome + createObj.earning;
                                    // Push data
                                    let tempObject = Object.assign({}, createObj);
                                    details.withdrawEarning.push(tempObject);

                                    // Return
                                    return true;

                                });
                            }

                            // Set new value for Manager All Income and Set value for Total Earning per claimed
                            details.managerEarning = []; // Default value of marnegr earning
                            if ((details.SHR_MANAGER).toString() === "100" && (dataManagerEarned !== undefined && dataManagerEarned.length > 0)) {
                                details.roi = 0;
                                details.income = 0;
                                details.breed = 0;
                                details.buy = 0;
                                details.reachedRoi = false; // For validation if ROI is completed
                                dataManagerEarned.map(data => {
                                    const createObj = {}; // Create Temp Obeject
                                    createObj.slp = data.SLPTOTAL;
                                    createObj.slpPrice = data.SLPCURRENCY;
                                    createObj.date = data.EARNED_ON;
                                    createObj.earning = Number(createObj.slp) * Number(createObj.slpPrice);
                                    // Update Total Income and SLP
                                    this.setState({
                                        totalManagerAllSLP: this.state.totalManagerAllSLP + Number(createObj.slp),
                                        totalManagerAllPHP: this.state.totalManagerAllPHP + createObj.earning
                                    })

                                    if (data.CATEGORY && (data.CATEGORY.toLowerCase()) === "withdraw") {
                                        if (!this.state.managerPHPReachedROI) {
                                            // Adding Return of Investment
                                            this.setState({
                                                managerPHPROI: this.state.managerPHPROI + createObj.earning
                                            })

                                            // Reached the ROI
                                            if (this.state.managerPHPROI >= this.state.managerPHPInvestment) {
                                                this.setState({
                                                    managerPHPReachedROI: true
                                                })
                                            }
                                        } else {
                                            // Adding total of Income
                                            this.setState({
                                                managerPHPIncome: this.state.managerPHPIncome + createObj.earning
                                            })
                                        }
                                    }

                                    if (data.CATEGORY && (data.CATEGORY.toLowerCase()) === "breed") {
                                        // Adding total cost for breeding
                                        this.setState({
                                            managerPHPBreed: this.state.managerPHPBreed + createObj.earning
                                        })
                                        details.breed = details.breed + createObj.earning;
                                    }

                                    if (data.CATEGORY && (data.CATEGORY.toLowerCase()) === "buy") {
                                        // Adding total cost for buying axie
                                        this.setState({
                                            managerPHPBuy: this.state.managerPHPBuy + createObj.earning
                                        })
                                    }

                                    // Push data
                                    let tempObject = Object.assign({}, createObj);
                                    details.managerEarning.push(tempObject);

                                    // Return
                                    return true;
                                })

                                // Update Data for Manager All Earning
                                this.setState({
                                    modalManagerAllEarning: details.managerEarning
                                })
                            }

                            // Has InGame SLP
                            if (result.inGameSLP > 0) {
                                // Minus the total InGame SLP and add in ronin if has Manager SLP Claimed x Manager Ronin Claimed
                                if (details.managerDebtClaimed !== undefined && details.managerDebtClaimed > 0) {
                                    managerSLPClaimed = details.managerDebtClaimed;
                                    result.managerRoninClaimed = true; // Indicator for Manager Claimed
                                    // Minus the InGame SLP
                                    if (result.inGameSLP > details.managerDebtClaimed) {
                                        result.inGameSLP = result.inGameSLP - details.managerDebtClaimed;
                                    } else {
                                        result.inGameSLP = details.managerDebtClaimed - result.inGameSLP;
                                    }

                                    // Update Manager Shared
                                    if (result.inGameSLP > details.managerDebtClaimed) {
                                        const managerShare = (details.SHR_MANAGER).toString() === "100" ? 1 : "0." + details.SHR_MANAGER;
                                        const currentInGameSLP = result.inGameSLP - details.managerDebtClaimed; // Minus again for computation of Manager Shared SLP
                                        result.sharedManagerSLP = Math.ceil(currentInGameSLP * managerShare);
                                        // Adding ronin balance in total Manage SLP x // Set new Total Manager's Earning
                                        this.setState({
                                            totalManagerSLP: this.state.totalManagerSLP + result.sharedManagerSLP
                                        })
                                    } else {
                                        // Zero manager shared
                                        result.sharedManagerSLP = 0;
                                    }
                                }

                                // Update Total InGame and Scholar SLP
                                this.setState({
                                    totalInGameSLP: this.state.totalInGameSLP + result.inGameSLP, // Set Total InGame SLP
                                    totalScholarSLP: this.state.totalScholarSLP + result.scholarSLP // Set Total Scholar SLP
                                })

                                // Set Average SLP per Day
                                if (result.claim_on_days > 0) {
                                    result.averageSLPDay = Math.floor(result.inGameSLP / result.claim_on_days);
                                    this.setState({
                                        totalAverageSLP: this.state.totalAverageSLP + result.averageSLPDay
                                    })
                                }
                            }

                            // Send Email if the MMR is low x for Scholar's only x send if user is manager
                            if (this.state.isUser === CONSTANTS.MESSAGE.MANAGER) {
                                if (ranking.eloStatus === "danger") {
                                    // Send an Email due to Lower MMR
                                    this.sendMMRMessage(result.name, details.EMAIL, ranking.elo, CONSTANTS.MESSAGE.EMAIL_LOWMMR_MESSAGE);
                                }

                                if (ranking.eloStatus === "warning") {
                                    // Send an Email due to Warning MMR
                                    // this.sendMMRMessage(result.name, details.EMAIL, ranking.elo, CONSTANTS.MESSAGE.EMAIL_WARNINGMMR_MESSAGE);
                                }
                            }

                            // Set new total SLP x computed base on Shared SLP plus total SLP
                            result.totalScholarEarningSLP = roninBalance + result.sharedScholarSLP + managerSLPClaimed;
                            // Set new total PHP x computed base on totalScholarEarningSLP multiply slpCurrentValue
                            result.totalScholarEarningPHP = result.totalScholarEarningSLP * this.state.slpCurrentValue;
                            // Set new total Manager SLP Earning x computed base on sharedManagerSLP multiply slpCurrentValue
                            result.totalManagerEarningPHP = result.sharedManagerSLP * this.state.slpCurrentValue;
                            // Set new total Sponsor SLP Earning x computed base on sharedSponsorSLP multiply slpCurrentValue
                            result.totalSponsorEarningPHP = result.sharedSponsorSLP * this.state.slpCurrentValue;
                        }

                        // Update value of win, lose, draw and win rate based in Battle Log
                        if(battleLogs.error === undefined) {
                            ranking.win_total = battleLogs.win_total;
                            ranking.lose_total = battleLogs.lose_total;
                            ranking.draw_total = battleLogs.draw_total;
                            ranking.win_rate = battleLogs.win_rate;
                            // Update PVP Energy left
                            result.pvp_energy = battleLogs.pvp_energy;
                        }

                        // Generate Daily SLP Data
                        let playerDataDailySLPwillSave = true // For checking if has data data to be save x true or false x true need to save / false no data to be save
                        try {
                            // Get TODAY SLP x Subtraction of InGameSLP and YESTERDAY
                            let todaySLP = Number(result.inGameSLP) - Number(details.YESTERDAY);
                            if (Number(details.YESTERDAY) > Number(result.inGameSLP)) {
                                // 0 ingameslp, already claimed
                                todaySLP = result.inGameSLP; // retain old data for newly claimed, must be update on the next day
                            }
                            // Check if the data from fetch is same date as date today
                            const toDate = moment(details.TODATE).format('YYYY-MM-DD HH:mm:ss');
                            const todayDate = moment().format('YYYY-MM-DD HH:mm:ss');
                            const isSameTODate = moment(toDate).isSame(todayDate, 'date');
                            if (!isSameTODate) {
                                // ToDate and date today is not equal x Check if the ToDate (time) is less than to 8AM (Reset of energy)
                                // const duration = (moment.duration(moment().diff(details.TODATE))).asHours();
                                const todateTime = moment(toDate).format('HHmmss');
                                if (Number(todateTime) >= Number("080000")) {
                                    // Update existing record for new data x another date x based in 8AM energy reset
                                    if (Number(result.claim_on_days) <= 1) {
                                        // Update daily slp for newly claimed x pass 1 day after claimed
                                        result.dailySLP = {
                                            ADDRESS: details.ADDRESS,
                                            YESTERDAY: 0,
                                            YESTERDAYRES: 0,
                                            TODAY: result.inGameSLP,
                                            TODATE: todayDate,
                                            ACTION: CONSTANTS.MESSAGE.UPDATE,
                                            MESSAGE: "UPDATE from energy reset and was claimed",
                                            UPDATEDON: todayDate,
                                            ALLFIELDS: true // to be save, if all fields or not x if false, only TODAY
                                        };
                                    } else {
                                        // Get YESTERDAY SLP base on YESTERDAY and TODAY SLP
                                        const yesterdySLP = Number(details.YESTERDAY) + Number(details.TODAY);
                                        // Get TODAY SLP base on InGameSLP and YESTERDAY SLP
                                        const todaysSLP = Number(result.inGameSLP) - Number(yesterdySLP);
                                        // Update daily slp with new date
                                        result.dailySLP = {
                                            ADDRESS: details.ADDRESS,
                                            YESTERDAY: yesterdySLP,
                                            YESTERDAYRES: details.TODAY,
                                            TODAY: todaysSLP,
                                            TODATE: todayDate,
                                            ACTION: CONSTANTS.MESSAGE.UPDATE,
                                            MESSAGE: "UPDATE from energy reset",
                                            UPDATEDON: todayDate,
                                            ALLFIELDS: true // to be save, if all fields or not x if false, only TODAY
                                        };
                                    }
                                } else {
                                    if (Number(todaySLP) > Number(details.TODAY)) {
                                        // Update Daily SLP with new TODAY SLP
                                        result.dailySLP = {
                                            ADDRESS: details.ADDRESS,
                                            YESTERDAY: details.YESTERDAY,
                                            YESTERDAYRES: details.YESTERDAYRES,
                                            TODAY: todaySLP,
                                            TODATE: toDate,
                                            ACTION: CONSTANTS.MESSAGE.UPDATE,
                                            MESSAGE: "UPDATE from isSameTODate false",
                                            UPDATEDON: todayDate,
                                            ALLFIELDS: false // to be save, if all fields or not x if false, only TODAY
                                        };
                                    } else {
                                        // Today SLP is same x no change required
                                        playerDataDailySLPwillSave = false;
                                        result.dailySLP = details;
                                        result.dailySLP.noChange = "isSameTODate - false";
                                    }
                                }
                            } else {
                                if (Number(todaySLP) > Number(details.TODAY)) {
                                    // Update Daily SLP with new TODAY SLP
                                    result.dailySLP = {
                                        ADDRESS: details.ADDRESS,
                                        YESTERDAY: details.YESTERDAY,
                                        YESTERDAYRES: details.YESTERDAYRES,
                                        TODAY: todaySLP,
                                        TODATE: toDate,
                                        ACTION: CONSTANTS.MESSAGE.UPDATE,
                                        MESSAGE: "UPDATE from isSameTODate true",
                                        UPDATEDON: todayDate,
                                        ALLFIELDS: false // to be save, if all fields or not x if false, only TODAY
                                    };
                                } else {
                                    // Today SLP is same x no change required
                                    playerDataDailySLPwillSave = false;
                                    result.dailySLP = details;
                                    result.dailySLP.noChange = "isSameTODate - true";
                                }
                            }
                        } catch (err) {
                            // Has error in generate daily slp x used default data for display in table
                            playerDataDailySLPwillSave = false;
                            result.dailySLP = {
                                ADDRESS: details.ADDRESS,
                                YESTERDAY: 0,
                                YESTERDAYRES: 0,
                                TODAY: 0,
                                ERROR: err
                            }
                        }

                        // Adding Player daily slp, details and ranking in result object
                        result.details = details;
                        result.ranking = ranking;

                        // Get all ETH Address x for other display x MMR Ranking x etc
                        this.state.playerRecords.push(result);

                        // Update Player Datatable row details
                        const playerDataTableRes = {
                            name: result.name,
                            averageSLP: <MDBBox data-th={CONSTANTS.MESSAGE.AVERAGE_SLP_PERDAY_V2} tag="span">{result.averageSLPDay}</MDBBox>,
                            dailySLP: <MDBBox data-th={CONSTANTS.MESSAGE.DAILYSLP} tag="span"><MDBBox tag="span" className={Number(result.dailySLP.YESTERDAYRES) > Number(result.dailySLP.TODAY) ? "green-text d-inline d-md-block d-lg-block" : "red-text d-inline d-md-block d-lg-block"}><strong>Y:</strong> {result.dailySLP.YESTERDAYRES}</MDBBox> <MDBBox tag="span" className={Number(result.dailySLP.YESTERDAYRES) > Number(result.dailySLP.TODAY) ? "red-text d-inline d-md-block d-lg-block" : "green-text d-inline d-md-block d-lg-block"}><strong>T:</strong> {result.dailySLP.TODAY}</MDBBox></MDBBox>,
                            ingameSLP: <MDBBox data-th={CONSTANTS.MESSAGE.INGAME_SLP} tag="span">{this.numberWithCommas(result.inGameSLP)}</MDBBox>,
                            sharedScholarSLP: <MDBBox data-th={CONSTANTS.MESSAGE.SHARED_SLP} tag="span" className="d-inline d-md-block d-lg-block">{this.numberWithCommas(result.sharedScholarSLP)} <MDBBox tag="span" className="d-inline d-md-block d-lg-block">({(details.SHR_MANAGER).toString() === "100" ? details.SHR_MANAGER : details.SHR_SCHOLAR}%)</MDBBox></MDBBox>,
                            roninSLP: <MDBBox data-th={CONSTANTS.MESSAGE.RONIN_SLP} tag="span">{this.numberWithCommas(roninBalance)} <MDBBox tag="span" className="d-inline d-md-block d-lg-block red-text">{result.managerRoninClaimed ? "(" + this.numberWithCommas(result.details.managerDebtClaimed) + ")" : ""}</MDBBox></MDBBox>,
                            totalScholarEarningSLP: <MDBBox data-th={CONSTANTS.MESSAGE.TOTAL_SLP} tag="span">{this.numberWithCommas(result.totalScholarEarningSLP)}</MDBBox>,
                            totalScholarEarningPHP: <MDBBox data-th={CONSTANTS.MESSAGE.EARNINGS_PHP} tag="span">{this.numberWithCommas((result.totalScholarEarningPHP).toFixed(2))}</MDBBox>,
                            claimOn: <MDBBox data-th={CONSTANTS.MESSAGE.CLAIMON} tag="span" className="d-block">{moment.unix(result.last_claimed_item_at).add(14, "days").format("MMM DD, hh:mm A")} <MDBBox tag="span" className="d-block">{result.claim_on_days} {CONSTANTS.MESSAGE.DAYS}</MDBBox></MDBBox>,
                            mmr: <MDBBox data-th={CONSTANTS.MESSAGE.MMR} tag="span" className={ranking.textStyle}>{this.numberWithCommas(ranking.elo)}</MDBBox>,
                            rank: <MDBBox data-th={CONSTANTS.MESSAGE.RANK} tag="span">{this.numberWithCommas(ranking.rank)}</MDBBox>,
                            mmrRank: <MDBBox data-th={CONSTANTS.MESSAGE.MMR} tag="span"><MDBBox tag="span" className={ranking.textStyle}>{this.numberWithCommas(ranking.elo)}</MDBBox> <MDBBox tag="span" className="d-inline d-md-block d-lg-block">{ranking.rank > 0 ? ("(" + this.numberWithCommas(ranking.rank) + ")") : ("")}</MDBBox></MDBBox>,
                            sharedManagerSLP: <MDBBox data-th={CONSTANTS.MESSAGE.SHARED_SLP} tag="span">{this.numberWithCommas(result.sharedManagerSLP)}</MDBBox>,
                            managerEarningsPHP: <MDBBox data-th={CONSTANTS.MESSAGE.EARNINGS_PHP} tag="span">{this.numberWithCommas((result.totalManagerEarningPHP).toFixed(2))}</MDBBox>,
                            sharedSponsorSLP: <MDBBox data-th={CONSTANTS.MESSAGE.SHARED_SLP} tag="span">{this.numberWithCommas(result.sharedSponsorSLP)}</MDBBox>,
                            sponsorEarningsPHP: <MDBBox data-th={CONSTANTS.MESSAGE.EARNINGS_PHP} tag="span">{this.numberWithCommas((result.totalSponsorEarningPHP).toFixed(2))}</MDBBox>,
                            nameMmr: `${result.name} (${ranking.elo})`,
                            nameInGameSLP: `${result.name} (${result.inGameSLP})`,
                            pvpEnergy: <MDBBox data-th={CONSTANTS.MESSAGE.PVP_ENERGY} tag="span">{result.pvp_energy}</MDBBox>,
                            clickEvent: this.modalPlayerDetailsToggle(result.client_id, [result])
                        };

                        // Create Excel data
                        const playerDataTableExport = {
                            Name: result.name,
                            InGameSLP: result.inGameSLP,
                            ManagerSLP: result.sharedManagerSLP,
                            SponsorSLP: result.sharedSponsorSLP,
                            ScholarSLP: result.totalScholarEarningSLP,
                            ClaimOn: moment.unix(result.last_claimed_item_at).add(14, "days").format("MMM DD, hh:mm A")
                        }
                        
                        // Success return
                        return resolve({error: false, data: playerDataTableRes, slp: result.inGameSLP, rank: ranking.rank, eth: userEthAddress, export: playerDataTableExport, dailySLP: result.dailySLP, dailySLPwillSave: playerDataDailySLPwillSave});
                    } else {
                        return reject({error: true});
                    }
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
                    return reject({error: true});
                }
            )
            .catch(
                (err) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
                    return reject({error: true});
                }
            )
        }).catch(err => {
            console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
            return err;
        });
    }

    // Get Player ranking base on Sky Mavis API
    getPlayerRanking = async (ethAddress) => {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "https://game-api.skymavis.com/game-api/leaderboard?client_id=" + ethAddress,
                dataType: "json",
                cache: false
            })
            .then(
                (result) => {
                    if (result.success && result.items.length > 0) {
                        const player = result.items.find(client => client.client_id === ethAddress);
                        if (Object.keys(player).length > 0) {
                            // Adding Win Rate
                            player.win_rate = 0;
                            if (player.win_total > 0 || player.lose_total > 0 || player.draw_total > 0) {
                                const winRate = ( (player.win_total / (player.win_total + player.lose_total + player.draw_total)) * 100 ).toFixed(2);
                                player.win_rate = !isNaN(winRate) ? winRate.toString() === "100.00" ? "100" : winRate : "0.00"
                            }
                            // Return
                            return resolve(player);
                        }
                    }
                    return resolve({error: true});
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
                    return reject({error: true})
                }
            )
            .catch(
                (err) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
                    return reject({error: true});
                }
            )
        }).catch(err => {
            console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
            return err;
        });
    }

    // Get Player battle log base on Game API Axie Technology
    getPlayerBattleLog = async (roninAddress, ethAddress, pvpEnergy) => {
        return new Promise((resolve, reject) => {
            const setPvpEnergy = pvpEnergy !== undefined ? pvpEnergy : 20; // 20 is Default energy
            $.ajax({
                url: "https://game-api.axie.technology/battlelog/" + roninAddress + "?limit=" + setPvpEnergy,
                dataType: "json",
                cache: false
            })
            .then(
                async (result) => {
                    if (result.length > 0 && result[0].success && result[0].items.length > 0) {
                        // Get Today Battle log only
                        let winTotal = 0, loseTotal = 0, drawTotal = 0;
                        let logsPromise = result[0].items.map(async function (logs) {
                            // Get the Client id winner today
                            const battleLogData = moment(logs.created_at).format('YYYY-MM-DD HH:mm');
                            const todayDate = moment().utc().format('YYYY-MM-DD 00:00');
                            // const gapData = moment().utc().add(24, "hours").format('YYYY-MM-DD HH:mm');
                            // const battleLogDataUnix = moment(battleLogData).unix();
                            // const todayDateUnix = moment(todayDate).unix();
                            // const gapDataUnix = moment(gapData).unix();
                            const isToday = moment(battleLogData).isSame(todayDate, 'date');
                            if (isToday) {
                                if (logs.winner === 0) {
                                    // 0 = Winner 1
                                    if (logs.first_client_id === ethAddress) {
                                        winTotal = winTotal + 1;
                                    } else {
                                        loseTotal = loseTotal + 1;
                                    }
                                } else if (logs.winner === 1) {
                                    // 1 = Winner 2
                                    if (logs.second_client_id === ethAddress) {
                                        winTotal = winTotal + 1;
                                    } else {
                                        loseTotal = loseTotal + 1;
                                    }
                                } else {
                                    // 2 = Draw // if (logs.winner === 2)
                                    drawTotal = drawTotal + 1;
                                }
                            }
                            
                            return true;
                        });

                        return await Promise.all(logsPromise).then(async function () {
                            const winRate = ( (winTotal / (winTotal + loseTotal + drawTotal)) * 100 ).toFixed(2);
                            const pvpEnergyLeft = setPvpEnergy - (winTotal + loseTotal + drawTotal);
                            const battleLog = {
                                win_total: winTotal,
                                lose_total: loseTotal,
                                draw_total: drawTotal,
                                win_rate: !isNaN(winRate) ? winRate.toString() === "100.00" ? "100" : winRate : "0.00",
                                pvp_energy: pvpEnergyLeft + "/" + setPvpEnergy
                            }
                            // Return
                            return resolve(battleLog);
                        });
                    }
                    return resolve({error: true});
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, error)
                    return reject({error: true})
                }
            )
            .catch(
                (err) => {
                    console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
                    return reject({error: true});
                }
            )
        }).catch(err => {
            console.error(CONSTANTS.MESSAGE.ERROR_OCCURED, err)
            return err;
        });
    }

    // Render Coingecko details
    renderCurrencies() {
        if (this.state.slpCurrentValue > 0) {
            return (
                <React.Fragment>
                    <MDBCol size="12" className="mb-3">
                        <MDBBox tag="div" className="py-3 px-2 text-center currency-details">
                            <MDBBox tag="span">
                                {CONSTANTS.MESSAGE.PRICE_BASEON}
                                
                                {
                                    this.state.currentValueFrm === CONSTANTS.MESSAGE.BINANCE ? (
                                        <a href="https://www.binance.com/en/trade/SLP_USDT" target="_blank" rel="noreferrer"> {CONSTANTS.MESSAGE.BINANCE}. </a>
                                    ) : (
                                        <a href="https://www.coingecko.com/en/coins/smooth-love-potion" target="_blank" rel="noreferrer"> {CONSTANTS.MESSAGE.COINGECKO}. </a>
                                    )
                                }
                                
                                {CONSTANTS.MESSAGE.CURRENT_EXCHANGERATE}:
                                <MDBBox tag="span">
                                    <strong> 1 {CONSTANTS.MESSAGE.SLP} = {this.state.slpCurrentValue} </strong>
                                    and
                                    <strong> 1 {CONSTANTS.MESSAGE.AXS} = {this.state.axsCurrentValue}</strong>
                                </MDBBox>
                            </MDBBox>
                        </MDBBox>
                    </MDBCol>
                </React.Fragment>
            )
        }
    }

    // Render Top scholar x ELO Ranking and SLP Earning
    renderTopScholar() {
        if ( this.state.isPlayerLoaded && this.state.isLoaded && !this.state.error ) {
            if (this.state.isUser !== CONSTANTS.MESSAGE.MANAGER && Object.keys(this.state.playerRecords).length > 0) {
                return (
                    <React.Fragment>
                        <MDBCol size="12" className="mb-3">
                            <MDBBox tag="div" className="py-3 px-2 text-center player-details cursor-pointer" onClick={this.modalMMRRankToggle(this.state.playerRecords)}>
                                {/* Top ELO / MMR Rank */}
                                <MDBBox tag="span" className="d-block d-md-inline d-lg-inline">{CONSTANTS.MESSAGE.TOP_MMR}: <strong>{this.state.topUserMMR}</strong></MDBBox>
                                {/* Top In Game SLP */}
                                <MDBBox tag="span" className="d-block d-md-inline d-lg-inline ml-2">{CONSTANTS.MESSAGE.TOP_INGAME_SLP}: <strong>{this.state.topUserSLP}</strong></MDBBox>
                            </MDBBox>
                        </MDBCol>
                    </React.Fragment>
                )
            }
        }
    }

    // Render Modal for viewing of MMR Ranking
    renderModalMMRRank() {
        return (
            <React.Fragment>
                <MDBModal isOpen={this.state.isModalMMRRankOpen} size="lg">
                    <MDBModalHeader toggle={this.modalMMRRankToggle("")}>{CONSTANTS.MESSAGE.MMR_RANKING}</MDBModalHeader>
                    <MDBModalBody>
                        <MDBDataTable
                            striped bordered hover responsive noBottomColumns
                            sortable={false}
                            entries={5}
                            displayEntries={false}
                            data={this.state.mmrDatatable}
                            className="default-datatable-container text-center"
                        />
                    </MDBModalBody>
                </MDBModal>
            </React.Fragment>
        )
    }

    // Render Total Earnings of Manager, Scholar and Sponsor
    renderEarnings() {
        if ( this.state.isPlayerLoaded && this.state.isLoaded && !this.state.error ) {
            if (this.state.isUser === CONSTANTS.MESSAGE.MANAGER) {
                return (
                    <React.Fragment>
                        {/* Top MMR and SLP */}
                        <MDBCol size="6" md="4" lg="2" className="my-2">
                            <MDBCard className="z-depth-2 player-details h-180px">
                                <MDBCardBody className="black-text cursor-pointer d-flex-center" onClick={this.modalMMRRankToggle(this.state.playerRecords)}>
                                    <MDBBox tag="div" className="text-center">
                                        {/* Top ELO / MMR Rank */}
                                        <MDBBox tag="span" className="d-block">{CONSTANTS.MESSAGE.TOP_MMR}</MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1rem font-weight-bold"><strong>{this.state.topUserMMR}</strong></MDBBox>
                                        {/* Top In Game SLP */}
                                        <MDBBox tag="span" className="d-block mt-3">{CONSTANTS.MESSAGE.TOP_INGAME_SLP}</MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1rem font-weight-bold"><strong>{this.state.topUserSLP}</strong></MDBBox>
                                    </MDBBox>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>

                        {/* Total Average SLP of all players */}
                        <MDBCol size="6" md="4" lg="2" className="my-2">
                            <MDBCard className="z-depth-2 player-details h-180px">
                                <MDBCardBody className="black-text d-flex-center">
                                    <MDBBox tag="div" className="text-center">
                                        <MDBBox tag="span" className="d-block">{CONSTANTS.MESSAGE.TOTAL_AVERAGE_SLP}</MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">
                                            <img src="/assets/images/smooth-love-potion.png" className="w-24px mr-1 mt-0pt3rem-neg" alt="SLP" />
                                            {this.numberWithCommas(Math.floor(this.state.totalAverageSLP / this.state.playerRecords.length))}
                                        </MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">&#8369; {this.numberWithCommas(((this.state.totalAverageSLP / this.state.playerRecords.length) * this.state.slpCurrentValue).toFixed(2))}</MDBBox>
                                    </MDBBox>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>

                        {/* Total SLP of all players */}
                        <MDBCol size="6" md="4" lg="2" className="my-2">
                            <MDBCard className="z-depth-2 player-details h-180px">
                                <MDBCardBody className="black-text d-flex-center">
                                    <MDBBox tag="div" className="text-center">
                                        <MDBBox tag="span" className="d-block">{CONSTANTS.MESSAGE.TOTAL_INGAME_SLP}</MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">
                                            <img src="/assets/images/smooth-love-potion.png" className="w-24px mr-1 mt-0pt3rem-neg" alt="SLP" />
                                            {this.numberWithCommas(this.state.totalInGameSLP)}
                                        </MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">&#8369; {this.numberWithCommas((this.state.totalInGameSLP * this.state.slpCurrentValue).toFixed(2))}</MDBBox>
                                    </MDBBox>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>

                        {/* Total Manager SLP */}
                        <MDBCol size="6" md="4" lg="2" className="my-2">
                            <MDBCard className="z-depth-2 player-details h-180px">
                                <MDBCardBody className="black-text cursor-pointer d-flex-center" onClick={this.modalEarningToggle(CONSTANTS.MESSAGE.MANAGER_EARNING, CONSTANTS.MESSAGE.MANAGER, this.state.managerEarningDatatable)}>
                                    <MDBBox tag="div" className="text-center">
                                        <MDBBox tag="span" className="d-block">{CONSTANTS.MESSAGE.TOTAL_MANAGERCLAIMABLE_SLP}</MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">
                                            <img src="/assets/images/smooth-love-potion.png" className="w-24px mr-1 mt-0pt3rem-neg" alt="SLP" />
                                            {this.numberWithCommas(this.state.totalManagerClaimableSLP)}
                                        </MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">&#8369; {this.numberWithCommas((this.state.totalManagerClaimableSLP * this.state.slpCurrentValue).toFixed(2))}</MDBBox>
                                    </MDBBox>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>

                        {/* Total Sponsor SLP */}
                        <MDBCol size="6" md="4" lg="2" className="my-2">
                            <MDBCard className="z-depth-2 player-details h-180px">
                                <MDBCardBody className="black-text d-flex-center">
                                    <MDBBox tag="div" className="text-center">
                                        <MDBBox tag="span" className="d-block">{CONSTANTS.MESSAGE.TOTAL_SPONSOR_SLP}</MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">
                                            <img src="/assets/images/smooth-love-potion.png" className="w-24px mr-1 mt-0pt3rem-neg" alt="SLP" />
                                            {this.numberWithCommas(this.state.totalSponsorSLP)}
                                        </MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">&#8369; {this.numberWithCommas((this.state.totalSponsorSLP * this.state.slpCurrentValue).toFixed(2))}</MDBBox>
                                    </MDBBox>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>

                        {/* Total Scholar SLP */}
                        <MDBCol size="6" md="4" lg="2" className="my-2">
                            <MDBCard className="z-depth-2 player-details h-180px">
                                <MDBCardBody className="black-text d-flex-center">
                                    <MDBBox tag="div" className="text-center">
                                        <MDBBox tag="span" className="d-block">{CONSTANTS.MESSAGE.TOTAL_SCHOLAR_SLP}</MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">
                                            <img src="/assets/images/smooth-love-potion.png" className="w-24px mr-1 mt-0pt3rem-neg" alt="SLP" />
                                            {this.numberWithCommas(this.state.totalScholarSLP)}
                                        </MDBBox>
                                        <MDBBox tag="span" className="d-block font-size-1pt3rem font-weight-bold">&#8369; {this.numberWithCommas((this.state.totalScholarSLP * this.state.slpCurrentValue).toFixed(2))}</MDBBox>
                                    </MDBBox>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>
                    </React.Fragment>
                )
            }
    
            if (this.state.isUser === this.state.isSponsorName) {
                if (this.state.totalSponsorSLP > 0) {
                    // Display Sponsor's Earning
                    return (
                        <React.Fragment>
                            <MDBCol size="12">
                                <MDBBox tag="div" className="py-3 px-2 text-center rgba-teal-strong">
                                    {
                                        // Display Sponsor's Earing
                                        this.state.totalSponsorSLP > 0 ? (
                                            <MDBBox tag="span" className="blue-whale d-block cursor-pointer" onClick={this.modalEarningToggle(CONSTANTS.MESSAGE.VIEW_SPONSOR_EARNING, CONSTANTS.MESSAGE.SPONSOR, this.state.playerRecords)}>
                                                {CONSTANTS.MESSAGE.SPONSOR_EARNING}: {CONSTANTS.MESSAGE.SLP} {this.state.totalSponsorSLP} (&#8369; {this.numberWithCommas((this.state.totalSponsorSLP * this.state.slpCurrentValue).toFixed(2))})
                                            </MDBBox>
                                        ) : ("")
                                    }
                                </MDBBox>
                            </MDBCol>
                        </React.Fragment>
                    )
                }
            }
            
        }
    }

    // Render Modal for viewing of Manager and Sponsor's Earning
    renderModalEarnings() {
        return (
            <React.Fragment>
                <MDBModal isOpen={this.state.isModalEarningOpen} size="lg">
                    <MDBModalHeader toggle={this.modalEarningToggle("", "", "")}>{this.state.modalEarningTitle}</MDBModalHeader>
                    <MDBModalBody>
                        {
                            this.state.isViewMangerEarning === CONSTANTS.MESSAGE.VIEW_CURRENT_EARNINGS || this.state.isUser !== CONSTANTS.MESSAGE.MANAGER ? (
                                // Manager Current Earnings
                                <React.Fragment>
                                    <MDBBox tag="u" className="d-block mb-2 cursor-pointer" onClick={this.onManagerEarningHandle.bind(this)}>{CONSTANTS.MESSAGE.VIEW_ALL_EARNINGS}</MDBBox> {/* Opposite label x for hide and show */}
                                    <MDBBox tag="span" className="d-block mb-2">
                                        {CONSTANTS.MESSAGE.TOTAL_CURRENT_EARNINGS}:
                                        <MDBBox tag="span" className="d-block d-md-inline d-lg-inline">
                                            <MDBBox tag="span">
                                                <img src="/assets/images/smooth-love-potion.png" className="w-24px mr-1 mt-0pt3rem-neg" alt="SLP" />
                                                <strong>{this.state.modalEarningFilter === CONSTANTS.MESSAGE.MANAGER ? this.state.totalManagerSLP : this.state.totalSponsorSLP}</strong>
                                            </MDBBox>
                                            <MDBBox tag="span"> 
                                                <span> &#8776; &#8369; </span>
                                                <strong>
                                                    {this.state.modalEarningFilter === CONSTANTS.MESSAGE.MANAGER ? (
                                                        // Manager's Earning
                                                        this.numberWithCommas((this.state.totalManagerSLP * this.state.slpCurrentValue).toFixed(2))
                                                    ) : (
                                                        // Sponsor's Earning
                                                        this.numberWithCommas((this.state.totalSponsorSLP * this.state.slpCurrentValue).toFixed(2))
                                                    )}
                                                </strong>
                                            </MDBBox>
                                        </MDBBox>
                                    </MDBBox>
                                    <MDBDataTable
                                        striped bordered hover responsive noBottomColumns
                                        searching={false}
                                        sortable={false}
                                        entries={5}
                                        displayEntries={false}
                                        data={this.state.modalEarningDetails}
                                        className="default-datatable-container text-center"
                                    />
                                </React.Fragment>
                            ) : (
                                // Manager All Earnings
                                <React.Fragment>
                                    <MDBBox tag="u" className="d-block mb-2 cursor-pointer" onClick={this.onManagerEarningHandle.bind(this)}>{CONSTANTS.MESSAGE.VIEW_CURRENT_EARNINGS}</MDBBox> {/* Opposite label x for hide and show */}
                                    <MDBTable scrollY maxHeight="70vh" bordered striped responsive>
                                        <MDBTableHead color="rgba-teal-strong" textWhite>
                                            <tr>
                                                <th colSpan="5" className="text-center font-weight-bold">{CONSTANTS.MESSAGE.MANAGER_EARNING}</th>
                                            </tr>
                                        </MDBTableHead>
                                        <MDBTableBody>
                                            {/* Total Earnings */}
                                            <tr className="text-center">
                                                <td rowSpan="2" className="font-weight-bold v-align-middle text-uppercase">{CONSTANTS.MESSAGE.TOTAL_EARNINGS}</td>
                                                <td colSpan="4" className="font-weight-bold">{CONSTANTS.MESSAGE.SLP}: {this.numberWithCommas(this.state.totalManagerAllSLP)}</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td colSpan="4" className="font-weight-bold table-gray-bg"><span>&#8369; </span>{this.numberWithCommas((this.state.totalManagerAllPHP).toFixed(2))}</td>
                                            </tr>
                                            {/* Income by Categories */}
                                            <tr className="text-center">
                                                <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.BUY}</td>
                                                <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.BREED}</td>
                                                <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.ROI}</td>
                                                <td colSpan="2" className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.INCOME}</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td>{this.numberWithCommas((this.state.managerPHPBuy).toFixed(2))}</td>
                                                <td>{this.numberWithCommas((this.state.managerPHPBreed).toFixed(2))}</td>
                                                <td className={this.state.managerPHPReachedROI ? "green-text" : "red-text"}>{this.numberWithCommas((this.state.managerPHPROI).toFixed(2))}</td>
                                                <td>{this.numberWithCommas((this.state.managerPHPIncome).toFixed(2))}</td>
                                            </tr>
                                            {/* Earning per cash out */}
                                            <tr className="rgba-teal-strong-bg">
                                                <td colSpan="5" className="text-center font-weight-bold white-text">{CONSTANTS.MESSAGE.EARNINGS}</td>
                                            </tr>
                                            <tr className="text-center">
                                                <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.DATE}</td>
                                                <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.SLP}</td>
                                                <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.SLP_PRICE}</td>
                                                <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.EARNING}</td>
                                            </tr>
                                            {
                                                Object.keys(this.state.modalManagerAllEarning).length > 0 ? (
                                                    this.state.modalManagerAllEarning.sort((a, b) =>  moment(b.date).unix() - moment(a.date).unix() ).map(items => (
                                                        <tr key={items.id} className="text-center">
                                                            <td>{<Moment format="MMM DD, YYYY">{items.date}</Moment>}</td>
                                                            <td>{items.slp}</td>
                                                            <td className="text-uppercase">{items.slpPrice}</td>
                                                            <td>{(items.earning).toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                ) : ("")
                                            }
                                        </MDBTableBody>
                                    </MDBTable>
                                </React.Fragment>
                            )
                        }
                    </MDBModalBody>
                </MDBModal>
            </React.Fragment>
        )
    }

    // Render Modal for viewing of Players Details
    renderModalPlayerDetails() {
        return (
            <React.Fragment>
                <MDBModal isOpen={this.state.isModalPlayerDetailsOpen} size="lg">
                    <MDBModalHeader toggle={this.modalPlayerDetailsToggle("", "")}>
                        {
                            Object.keys(this.state.modalPlayerDetails).length > 0 ? (
                                <React.Fragment>
                                    {this.state.modalPlayerDetails[0].name}
                                </React.Fragment>
                            ) : (CONSTANTS.MESSAGE.DETAILS)
                        }
                    </MDBModalHeader>
                    <MDBModalBody>
                        {/* Header details */}
                        {
                            Object.keys(this.state.modalPlayerDetails).length > 0 ? (
                                this.state.modalPlayerDetails.map((items, index) => (
                                    index === 0 ? (
                                        // Retreive only first loop x must be single display x "this.state.modalPlayerDetails" is already filtered
                                        <React.Fragment key={items.client_id}>
                                            <MDBRow between>
                                                {/* Started playing */}
                                                <MDBCol size="12" md="6" lg="6">
                                                    <MDBBox tag="span" className="d-block">
                                                        {CONSTANTS.MESSAGE.STARTED} <Moment format="MMM DD, YYYY">{items.details.STARTED_ON}</Moment>
                                                    </MDBBox>
                                                </MDBCol>
                                                {/* Market Place link */}
                                                <MDBCol size="12" md="6" lg="6">
                                                    <MDBBox tag="u" className="d-block d-md-none d-lg-none">
                                                        <a href={"https://marketplace.axieinfinity.com/profile/" + items.details.ADDRESS + "/axie"} target="_blank" rel="noreferrer" className="black-text">
                                                            {CONSTANTS.MESSAGE.OPEN_MARKETPLACE_PROFILE}
                                                        </a>
                                                    </MDBBox>
                                                    <MDBBox tag="u" className="d-none d-md-block d-lg-block text-right">
                                                        <a href={"https://marketplace.axieinfinity.com/profile/" + items.details.ADDRESS + "/axie"} target="_blank" rel="noreferrer" className="black-text">
                                                            {CONSTANTS.MESSAGE.OPEN_MARKETPLACE_PROFILE}
                                                        </a>
                                                    </MDBBox>
                                                </MDBCol>
                                                {/* Email */}
                                                {
                                                    this.state.isUser === CONSTANTS.MESSAGE.MANAGER ? (
                                                        <MDBCol size="12">
                                                            <MDBBox tag="span" className="d-block selectable-text">
                                                                {CONSTANTS.MESSAGE.EMAIL}: {items.details.EMAIL}
                                                            </MDBBox>
                                                        </MDBCol>
                                                    ) : ("")
                                                }
                                            </MDBRow>
                                        </React.Fragment>
                                    ) : ("")
                                ))
                            ) : ("")
                        }

                        {/* Table Details */}
                        <MDBTable scrollY maxHeight="70vh" bordered striped responsive className="mt-2">
                            <MDBTableBody>
                                {/* Arena Game Status */}
                                <tr>
                                    <td colSpan="4" className="text-center font-weight-bold rgba-teal-strong white-text">{CONSTANTS.MESSAGE.ARENAGAME_STATUS}</td>
                                </tr>
                                <tr className="text-center">
                                    <td className="font-weight-bold text-uppercase table-gray-bg">{CONSTANTS.MESSAGE.WIN}</td>
                                    <td className="font-weight-bold text-uppercase table-gray-bg">{CONSTANTS.MESSAGE.LOSE}</td>
                                    <td className="font-weight-bold text-uppercase table-gray-bg">{CONSTANTS.MESSAGE.DRAW}</td>
                                    <td className="font-weight-bold text-uppercase table-gray-bg">{CONSTANTS.MESSAGE.WIN_RATE}</td>
                                </tr>
                                {
                                    Object.keys(this.state.modalPlayerDetails).length > 0 ? (
                                        this.state.modalPlayerDetails.map(items => (
                                            <tr key={items.client_id} className="text-center">
                                                <td className="white-bg">{items.ranking.win_total}</td>
                                                <td className="white-bg">{items.ranking.lose_total}</td>
                                                <td className="white-bg">{items.ranking.draw_total}</td>
                                                <td className="white-bg">{items.ranking.win_rate}%</td>
                                            </tr>
                                        ))
                                    ) : ("")
                                }
                                {/* Total Income */}
                                <tr>
                                    <td colSpan="4" className="text-center font-weight-bold rgba-teal-strong white-text">
                                        <span>{CONSTANTS.MESSAGE.TOTALINCOME}: &#8369; </span>
                                        {
                                            Object.keys(this.state.modalPlayerDetails).length > 0 && this.state.modalPlayerDetails[0].details.totalIncome !== undefined ? (
                                                <React.Fragment>
                                                    {(this.state.modalPlayerDetails[0].details.totalIncome).toLocaleString()}
                                                </React.Fragment>
                                            ) : ("0")
                                        }
                                    </td>
                                </tr>
                                <tr className="text-center">
                                    <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.DATE}</td>
                                    <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.SLP}</td>
                                    <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.SLP_PRICE}</td>
                                    <td className="font-weight-bold text-uppercase">{CONSTANTS.MESSAGE.EARNING}</td>
                                </tr>
                                {
                                    Object.keys(this.state.modalPlayerDetails).length > 0 ? (
                                        this.state.modalPlayerDetails[0].details.withdrawEarning !== undefined && 
                                        Object.keys(this.state.modalPlayerDetails[0].details.withdrawEarning).length > 0 ? (
                                            (this.state.modalPlayerDetails[0].details.withdrawEarning).sort((a, b) => moment(b.date).unix() - moment(a.date).unix()).map(items => (
                                                <tr key={items.date} className="text-center">
                                                    <td>{<Moment format="MMM DD, YYYY">{items.date}</Moment>}</td>
                                                    <td>{items.slp}</td>
                                                    <td className="text-uppercase">{items.slpPrice}</td>
                                                    <td>{(items.earning).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        ) : ("")
                                    ) : ("")
                                }
                            </MDBTableBody>
                        </MDBTable>
                    </MDBModalBody>
                </MDBModal>
            </React.Fragment>
        )
    }

    // Render Modal for adding new team
    renderModalIskoInputs() {
        return (
            <React.Fragment>
                <MDBModal isOpen={this.state.isModalIskoInputsOpen} size="md">
                    <MDBModalHeader toggle={this.modalIskoInputs("")} className="blue-whale">{CONSTANTS.MESSAGE.LOKI_INPUTS}</MDBModalHeader>
                    <MDBModalBody>
                        <MDBNav className="nav-tabs">
                            <MDBNavItem>
                                <span
                                    className={this.state.tabIskoInputsActive === "1" ? "nav-link cursor-pointer active" : "nav-link cursor-pointer"}
                                    onClick={this.tabsIskoInputs("1")}
                                    role="tab" >
                                    {CONSTANTS.MESSAGE.ADD_EDIT}
                                </span>
                            </MDBNavItem>
                            <MDBNavItem>
                                <span
                                    className={this.state.tabIskoInputsActive === "2" ? "nav-link active cursor-pointer" : "nav-link cursor-pointer"}
                                    onClick={this.tabsIskoInputs("2")}
                                    role="tab" >
                                    {CONSTANTS.MESSAGE.WITHDRAW}
                                </span>
                            </MDBNavItem>
                            <MDBNavItem>
                                <span
                                    className={this.state.tabIskoInputsActive === "3" ? "nav-link active cursor-pointer" : "nav-link cursor-pointer"}
                                    onClick={this.tabsIskoInputs("3")}
                                    role="tab" >
                                    {CONSTANTS.MESSAGE.MANAGER_EARNING}
                                </span>
                            </MDBNavItem>
                        </MDBNav>
                        <MDBTabContent activeItem={this.state.tabIskoInputsActive} >
                            <MDBTabPane tabId="1" role="tabpanel">
                                <form onSubmit={this.onAddEditRecordHandle.bind(this)} className="addEdit-inputHolder">
                                    <MDBBox tag="div" className="grey-text">
                                        <MDBBox tag="div" className="select-mdb-custom mt-3">
                                            <MDBBox tag="select" className="select-mdb-content" onChange={this.handleAddEditIskoChange.bind(this)} value={this.state.slctAddEditId}>
                                                <MDBBox tag="option" value="">{CONSTANTS.MESSAGE.ADDNEW_ISKO}</MDBBox>
                                                {
                                                    Object.keys(this.state.playerRecords).length > 0 ? (
                                                        this.state.playerRecords.sort((a, b) =>  b.inGameSLP - a.inGameSLP ).map((item) => (
                                                            <MDBBox tag="option" key={item.client_id} value={item.cliend_id}>
                                                                {item.name}
                                                            </MDBBox>
                                                        ))
                                                    ) : ("")
                                                }
                                            </MDBBox>
                                            <MDBBox tag="span" className="select-mdb-bar"></MDBBox>
                                            <MDBBox tag="label" className="col select-mdb-label"></MDBBox>
                                        </MDBBox>
                                        <div className="md-form">
                                            <i data-test="fa" className="fa fa-address-book prefix"></i>
                                            <input data-test="input" type="text" className="form-control" name="ADDRESS" required />
                                            <label className="active">{CONSTANTS.MESSAGE.RONIN_ADDRESS}</label>
                                        </div>
                                        <div className="md-form">
                                            <i data-test="fa" className="fa fa-user prefix"></i>
                                            <input data-test="input" type="text" className="form-control" name="NAME" required />
                                            <label className="active">{CONSTANTS.MESSAGE.NAME}</label>
                                        </div>
                                        <div className="md-form">
                                            <i data-test="fa" className="fa fa-envelope prefix"></i>
                                            <input data-test="input" type="email" className="form-control" name="EMAIL" required />
                                            <label className="active">{CONSTANTS.MESSAGE.EMAIL}</label>
                                        </div>
                                        <MDBRow className="mt-1pt5rem-neg" between>
                                            <MDBCol size="6">
                                                <div className="md-form">
                                                    <input data-test="input" type="number" className="form-control" name="SHR_MANAGER" min="0" max="100" required />
                                                    <label className="active">{CONSTANTS.MESSAGE.MANAGER}</label>
                                                </div>
                                            </MDBCol>
                                            <MDBCol size="6">
                                                <div className="md-form">
                                                    <input data-test="input" type="number" className="form-control" name="SHR_SCHOLAR" min="0" max="100" required />
                                                    <label className="active">{CONSTANTS.MESSAGE.SCHOLAR}</label>
                                                </div>
                                            </MDBCol>
                                        </MDBRow>
                                        <MDBInput containerClass="md-form mt-2rem-neg checkbox-mdb-custom" label={CONSTANTS.MESSAGE.HASSPONSOR} type="checkbox" id="hasSponsor-checkbox" checked={this.state.hasSponsor} onChange={this.handleHasSponsorCheckChange.bind(this)} />
                                        {
                                            this.state.hasSponsor ? (
                                                <MDBRow className="mt-1pt5rem-neg" between>
                                                    <MDBCol size="6">
                                                        <div className="md-form">
                                                            <i data-test="fa" className="fa fa-user prefix"></i>
                                                            <input data-test="input" type="text" className="form-control" name="SPONSOR_NAME" required />
                                                            <label className="active">{CONSTANTS.MESSAGE.SPONSOR_NAME}</label>
                                                        </div>
                                                    </MDBCol>
                                                    <MDBCol size="6">
                                                        <div className="md-form">
                                                            <input data-test="input" type="number" className="form-control" name="SHR_SPONSOR" min="0" max="100" required />
                                                            <label className="active">{CONSTANTS.MESSAGE.SPONSOR_SHARE}</label>
                                                        </div>
                                                    </MDBCol>
                                                </MDBRow>
                                            ) : ("")
                                        }
                                        <MDBBox tag="div" className={this.state.isValidAddTeam === 0 ? "d-none" : this.state.isValidAddTeam ? "d-none" : "invalid-feedback mt-0pt3rem-neg mb-2 px-3 d-block"}>{this.state.errorMsg}</MDBBox>
                                    </MDBBox>
                                    <MDBBox tag="div" className="text-center">
                                        <button className="btn btn-default waves-effect waves-light">
                                            <MDBIcon icon="paper-plane" className="mr-1" />
                                            {CONSTANTS.MESSAGE.SUBMIT}
                                        </button>
                                    </MDBBox>
                                </form>
                            </MDBTabPane>
                            <MDBTabPane tabId="2" role="tabpanel">
                                <MDBBox tag="div" className="select-mdb-custom mt-3">
                                    <MDBBox tag="select" className="select-mdb-content" onChange={this.handleClaimChange.bind(this)} value={this.state.slctClaimId}>
                                        <MDBBox tag="option" value="">{CONSTANTS.MESSAGE.SELECT_NAME}</MDBBox>
                                        {
                                            Object.keys(this.state.playerRecords).length > 0 ? (
                                                this.state.playerRecords.sort((a, b) =>  b.inGameSLP - a.inGameSLP ).map((item) => (
                                                    <MDBBox tag="option" key={item.client_id} value={item.cliend_id}>
                                                        {item.name}
                                                    </MDBBox>
                                                ))
                                            ) : ("")
                                        }
                                    </MDBBox>
                                    <MDBBox tag="span" className="select-mdb-bar"></MDBBox>
                                    <MDBBox tag="label" className="col select-mdb-label"></MDBBox>
                                </MDBBox>
                                <form onSubmit={this.onWithdrawHandle.bind(this)} className="claim-inputHolder">
                                    <MDBBox tag="div" className="grey-text">
                                        <MDBInput label={CONSTANTS.MESSAGE.RONIN_ADDRESS} name="ADDRESS" type="text" required disabled />
                                        <div className="md-form">
                                            <input data-test="input" type="number" min="0" className="form-control" name="SLPCURRENCY" step="0.01" required />
                                            <label className="active">{CONSTANTS.MESSAGE.SLP_CURRENCY}</label>
                                        </div>
                                        <div className="md-form">
                                            <input data-test="input" type="number" min="0" className="form-control" name="SHR_MANAGER" required />
                                            <label className="active">{CONSTANTS.MESSAGE.MANAGER_SLP}</label>
                                        </div>
                                        <div className="md-form">
                                            <input data-test="input" type="number" min="0" className="form-control" name="SHR_SCHOLAR" required />
                                            <label className="active">{CONSTANTS.MESSAGE.SCHOLAR_SLP}</label>
                                        </div>
                                        <div className="md-form">
                                            <input data-test="input" type="number" min="0" className="form-control" name="SHR_SPONSOR" required />
                                            <label className="active">{CONSTANTS.MESSAGE.SPONSOR_SLP}</label>
                                        </div>
                                        <div className="md-form">
                                            <input data-test="input" type="date" className="form-control" name="WITHDRAW_ON" required />
                                            <label className="active">{CONSTANTS.MESSAGE.WITHDRAWON}</label>
                                        </div>
                                    </MDBBox>
                                    <MDBBox tag="div" className={this.state.isValidWithdraw === 0 ? "d-none" : this.state.isValidWithdraw ? "d-none" : "invalid-feedback mt-1pt5rem-neg mb-2 px-3 d-block"}>{this.state.errorMsg}</MDBBox>
                                    <MDBBox tag="div" className="text-center">
                                        <button className="btn btn-default waves-effect waves-light" disabled>
                                            <MDBIcon icon="paper-plane" className="mr-1" />
                                            {CONSTANTS.MESSAGE.SUBMIT}
                                        </button>
                                    </MDBBox>
                                </form>
                            </MDBTabPane>
                            <MDBTabPane tabId="3" role="tabpanel">
                                <form onSubmit={this.onManagerEarnedHandle.bind(this)} className="managerEarn-inputHolder">
                                    <MDBBox tag="div" className="grey-text">
                                        <MDBInput label={CONSTANTS.MESSAGE.TOTAL_SLP} name="SLPTOTAL" type="number" min="0" required />
                                        <MDBInput label={CONSTANTS.MESSAGE.SLP_CURRENCY} name="SLPCURRENCY" type="number" step="0.01" min="0" required />
                                        <MDBBox tag="div" className="select-mdb-custom mt-2">
                                            <MDBBox tag="select" className="select-mdb-content">
                                                <MDBBox tag="option" value={CONSTANTS.MESSAGE.BUY}>{CONSTANTS.MESSAGE.BUY}</MDBBox>
                                                <MDBBox tag="option" value={CONSTANTS.MESSAGE.BREED}>{CONSTANTS.MESSAGE.BREED}</MDBBox>
                                                <MDBBox tag="option" value={CONSTANTS.MESSAGE.WITHDRAW}>{CONSTANTS.MESSAGE.WITHDRAW}</MDBBox>
                                            </MDBBox>
                                            <MDBBox tag="span" className="select-mdb-bar"></MDBBox>
                                            <MDBBox tag="label" className="col select-mdb-label"></MDBBox>
                                        </MDBBox>
                                        <div className="md-form">
                                            <input data-test="input" type="date" className="form-control" name="EARNED_ON" required />
                                            <label className="active">{CONSTANTS.MESSAGE.EARNEDON}</label>
                                        </div>
                                    </MDBBox>
                                    <MDBBox tag="div" className={this.state.isValidManagerEarn === 0 ? "d-none" : this.state.isValidManagerEarn ? "d-none" : "invalid-feedback mt-1pt5rem-neg mb-2 px-3 d-block"}>{this.state.errorMsg}</MDBBox>
                                    <MDBBox tag="div" className="text-center">
                                        <button className="btn btn-default waves-effect waves-light">
                                            <MDBIcon icon="paper-plane" className="mr-1" />
                                            {CONSTANTS.MESSAGE.SUBMIT}
                                        </button>
                                    </MDBBox>
                                </form>
                            </MDBTabPane>
                        </MDBTabContent>
                    </MDBModalBody>
                </MDBModal>
            </React.Fragment>
        )
    }

    renderEmptyDetails() {
        return (
            <React.Fragment>
                <MDBRow className="justify-content-center align-self-center">
                    <MDBCol size="12" className="justify-content-center align-self-center text-center">
                        <img src="/assets/images/axie_char.png" className="w-200px mt-5" alt="No Data Found" />
                        <MDBBox tag="span" className="d-block py-3 font-size-3rem font-family-architects-daughter red-text">{CONSTANTS.MESSAGE.SOMETHING_WENT_WRONG}</MDBBox>
                        <MDBBox tag="span" className="d-block font-size-3rem font-family-architects-daughter orange-text">{CONSTANTS.MESSAGE.NODATA_FOUND}</MDBBox>
                    </MDBCol>
                </MDBRow>
            </React.Fragment>
        )
    }

    render() {
        document.title = CONSTANTS.MESSAGE.HOMETITLE;
        return (
            <MDBBox tag="div" className="home-wrapper">
                <MDBAnimation type="bounce" className="z-index-1 position-fixed guides-btn">
                    {
                        this.state.isUser === CONSTANTS.MESSAGE.MANAGER ? (
                            <React.Fragment>
                                {/* Scholar's input */}
                                <button type="button" className="btn btn-default waves-effect waves-light d-block iskoInputs"
                                    onClick={this.modalIskoInputs()}>
                                    <MDBIcon icon="graduation-cap" className="fa-2x" />
                                </button>

                                {
                                    //  Object.keys(this.state.exportData).length > 0 ? (
                                    //     <React.Fragment>
                                    //         {/* Export Data */}
                                    //         <ExportCSV csvData={this.state.exportData} fileName={CONSTANTS.MESSAGE.TEAMLOKI + "_" + moment().format("MMDDYYYY_HHmmss")}/>
                                    //     </React.Fragment>
                                    // ) : ("")
                                }
                            </React.Fragment>
                        ) : ("")
                    }

                    {/* Open Guides */}
                    <button type="button" className="btn btn-default waves-effect waves-light"
                        onClick={() => this.setState({ isLightBoxOpen: true })}>
                        <MDBIcon icon="info-circle" className="fa-3x" />
                    </button>
                </MDBAnimation>

                {
                    !this.state.isLoaded ? (
                        // Loading
                    <MDBBox tag="div" className="loader-section">
                        <MDBBox tag="div" className="position-fixed z-index-9999 l-0 t-0 r-0 b-0 m-auto overflow-visible flex-center">
                            <MDBBox tag="span" className="loader-spin-dual-ring"></MDBBox>
                            <MDBBox tag="span" className="ml-2 font-size-1rem white-text">{CONSTANTS.MESSAGE.LOADING_TEXT}</MDBBox>
                        </MDBBox>
                        <MDBBox tag="div" className="loader-backdrop position-fixed z-index-1040 l-0 t-0 r-0 b-0 black"></MDBBox>
                    </MDBBox>
                    ) : ("")
                }

                {/* Render Notification Bar for Page refresh, Coingecko details and Top Scholar */}
                <MDBContainer className="pt-5 mt-5 position-relative">
                    <MDBRow>
                        {this.renderCurrencies()}
                        {this.renderTopScholar()}
                        {this.renderEarnings()}
                    </MDBRow>
                </MDBContainer>

                {
                    this.state.error && this.state.isLoaded ? (
                        // Empty Player details x Error in Ajax
                        <MDBContainer fluid className="pt-3 pb-5 mb-5 position-relative display-margin">
                            {this.renderEmptyDetails()}
                            {this.pageRefresh(5000)} {/* Refresh in 5 seconds if there's an error */}
                        </MDBContainer>
                    ) : (
                        Object.keys(this.state.playerRecords).length <= 0 ? (
                            // Empty Player details
                            <MDBContainer fluid className="pt-3 pb-5 mb-5 position-relative display-margin">
                                {this.renderEmptyDetails()}
                            </MDBContainer>
                        ) : (
                            // Diplay Player details
                            <MDBContainer className="pt-3 pb-5 mb-5 position-relative display-margin">
                                <MDBRow>
                                    {
                                        Object.keys(this.state.playerRecords).length > 0 ? (
                                            // Display all data
                                            <MDBCol size="12">
                                                <MDBDataTable
                                                    striped bordered hover responsive noBottomColumns
                                                    sortable={false}
                                                    data={this.state.playerDataTable}
                                                    entries={5}
                                                    entriesOptions={[ 5, 10, 15 ]}
                                                    className="player-datatable-container text-white"
                                                />
                                            </MDBCol>
                                        ) : (
                                            // Display no data
                                            this.renderEmptyDetails()
                                        )
                                    }
                                </MDBRow>
                            </MDBContainer>
                        )
                    )
                }

                {/* Light Box */}
                {
                    this.state.isLightBoxOpen && (
                        <Lightbox
                            mainSrc={guildImages[this.state.photoIndex]}
                            nextSrc={guildImages[(this.state.photoIndex + 1) % guildImages.length]}
                            prevSrc={guildImages[(this.state.photoIndex + guildImages.length - 1) % guildImages.length]}
                            onCloseRequest={() => this.setState({ isLightBoxOpen: false })}
                            onMovePrevRequest={() =>
                                this.setState({
                                    photoIndex: (this.state.photoIndex + guildImages.length - 1) % guildImages.length,
                                })
                            }
                            onMoveNextRequest={() =>
                                this.setState({
                                    photoIndex: (this.state.photoIndex + 1) % guildImages.length,
                                })
                            }
                        />
                    )
                }

                {/* Render Modal */}
                {this.renderModalEarnings()}
                {this.renderModalMMRRank()}
                {this.renderModalPlayerDetails()}
                {this.renderModalIskoInputs()}
            </MDBBox>
        )
    }
}

export default Home