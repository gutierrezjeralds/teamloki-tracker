/*eslint no-console: 0*/
"use strict";

/**
 * Heroku Postgresql Process
 * Objective: Router for Team Loki data
 */

// Dependencies
const express = require("express");
const { Client } = require('pg');
const router = express.Router();
const clientRequest = require("../handlers/ClientRequest");
const { MESSAGE, HEROKU } = require("../../client/src/components/Constants");

/*
    ReactJS Buildpack Heroku
    ** https://buildpack-registry.s3.amazonaws.com/buildpacks/mars/create-react-app.tgz
*/

const pgConn = {
    connectionString: process.env.POSTGRES_URI,
    ssl: {
      rejectUnauthorized: false
    }
}

/*
    Tables
    ** TB_USERPROFILE
    **** ID, ADDRESS, NAME, EMAIL, PASS, SHR_MANAGER, SHR_SCHOLAR, SHR_SPONSOR, SPONSOR_NAME, STARTED_ON, SLP_CLAIMED, DELETEIND (X), HIGH_SLP_GAIN, HIGH_SLP_DATE
    ** TB_WITHDRAW
    **** ID, ADDRESS, SLPTOTAL, SLPCURRENCY, WITHDRAW_ON
    ** TB_DAILYSLP
    **** ID, ADDRESS, YESTERDAY, YESTERDAYRES, TODAY, TODATE
    ** TB_MANAGEREARNED
    **** ID, SLPTOTAL, SLPCURRENCY, CATEGORY, EARNED_ON
    ** TB_YESTERDAYSLP x This for creating chart for yesterday slp gained
    **** ID, ADDRESS, YESTERDAY, DATE_ON, MMR
*/

// All other GET requests not handled before will return our React app
// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
// });

// POST Method x Get Access Token
router.post("/authLogin", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_GENERATE_TOKEN);
        
        // Body payload
        const payload = req.body;

        // Execute Process of Auth Login
        const accessToken = await clientRequest.authLogin(payload, req.logger);
        return res.type("application/json").status(200).send(accessToken); // Return response form Auth Login
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// POST Method x Get In Game SLP
router.post("/getInGameSLP", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_INGAMESLP_API);
        
        // Body payload
        const payload = req.body;

        // Execute Process of Auth Login
        const inGameSLP = await clientRequest.inGameSLP(payload, req.logger);
        return res.type("application/json").status(200).send(inGameSLP); // Return response form InGame SLP
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// POST Method x Get In Game SLP
router.get("/getCryptoCoins", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_CRYPTOCOINS_API);

        // Execute Process of Crypto Coins
        const inGameSLP = await clientRequest.getCryptoCoins(req.logger);
        return res.type("application/json").status(200).send(inGameSLP); // Return response form InGame SLP
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// GET Method x Fetch User Profile x TB_USERPROFILE
router.get("/userProfile", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_SELECTQUERY);

        // Conect to postgres
        const client = new Client(pgConn);
        client.connect();

        // Execute Query x JOIN table
        const query = `${HEROKU.QUERY.SELECT.USERPROFILE}`;
        client.query(query, (error, result) => {
            req.logger.info(MESSAGE.END_SELECTQUERY);
            // End Connection
            client.end();
            if (error) {
                req.logger.error(MESSAGE.ERROR_OCCURED, error);
                return res.type("application/json").status(500).send({
                    error: true,
                    data: error
                });
            } else {
                return res.type("application/json").status(200).send({
                    error: false,
                    data: result.rows
                });
            }
        });
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
})

// GET Method x Fetch User Profile x TB_USERPROFILE
router.get("/login", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_SELECTQUERY);

        // Conect to postgres
        const client = new Client(pgConn);
        client.connect();

        // Param payload
        const param = req.query;
        if (param.credential) {
            const access = (decodeURI(param.credential)).replace(/\s+/g, '+'); // Decode URL x replace space from "+" into value of "+"

            // Execute Query x JOIN table
            const query = `${HEROKU.QUERY.SELECT.USERPROFILE} WHERE UPPER("NAME") = '${access}' OR UPPER("EMAIL") = '${access}' OR UPPER("SPONSOR_NAME") = '${access}'`;
            client.query(query, (error, result) => {
                req.logger.info(MESSAGE.END_SELECTQUERY);
                // End Connection
                client.end();
                if (error) {
                    req.logger.error(MESSAGE.ERROR_OCCURED, error);
                    return res.type("application/json").status(500).send({
                        error: true,
                        data: error
                    });
                } else {
                    return res.type("application/json").status(200).send({
                        error: false,
                        data: result.rows
                    });
                }
            });
        } else {
            req.logger.error(MESSAGE.ERROR_PROCEDURE);
            return res.type("application/json").status(500).send({
                error: true,
                data: MESSAGE.ERROR_PROCEDURE
            });
        }
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
})

// GET Method x Fetch records x TB_USERPROFILE + TB_WITHDRAW + TB_DAILYSLP
router.get("/records", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_SELECTQUERY);

        // Conect to postgres
        const client = new Client(pgConn);
        client.connect();

        // Execute Query x JOIN table
        const query = `SELECT "USER".*, "DAILY"."YESTERDAY", "DAILY"."YESTERDAYRES", "DAILY"."TODAY", "DAILY"."TODATE" FROM ${HEROKU.TABLE.USERPROFILE} AS "USER" JOIN ${HEROKU.TABLE.DAILYSLP} AS "DAILY" ON "USER"."ADDRESS" = "DAILY"."ADDRESS"`;
        client.query(query, (error, result) => {
            if (error) {
                req.logger.error(MESSAGE.ERROR_OCCURED, error);
                // End Connection
                client.end();
                return res.type("application/json").status(500).send({
                    error: true,
                    data: error
                });
            } else {
                // Execute Query x TB_WITHDRAW
                const query = `${HEROKU.QUERY.SELECT.WITHDRAW}`;
                client.query(query, (err, dataWithdraw) => {
                    req.logger.info(MESSAGE.END_SELECTQUERY);
                    if (err) {
                        // End Connection
                        client.end();
                        req.logger.error(MESSAGE.ERROR_OCCURED, err);
                        return res.type("application/json").status(200).send({
                            error: false,
                            data: result.rows,
                            withdraw: [],
                            managerEarned: []
                        });
                    } else {
                        // Execute Query x TB_YESTERDAYSLP
                        const query = `${HEROKU.QUERY.SELECT.YESTERDAYSLP}`;
                        client.query(query, (err, dataYesterday) => {
                            req.logger.info(MESSAGE.END_SELECTQUERY);
                            if (err) {
                                // End Connection
                                client.end();
                                req.logger.error(MESSAGE.ERROR_OCCURED, err);
                                return res.type("application/json").status(200).send({
                                    error: false,
                                    data: result.rows,
                                    withdraw: dataWithdraw.rows,
                                    yesterdaySLP: [],
                                    managerEarned: []
                                });
                            } else {
                                // Execute Query x TB_MANAGEREARNED
                                const query = `${HEROKU.QUERY.SELECT.MANAGEREARNED}`;
                                client.query(query, (err, dataManager) => {
                                    req.logger.info(MESSAGE.END_SELECTQUERY);
                                    // End Connection
                                    client.end();
                                    if (err) {
                                        req.logger.error(MESSAGE.ERROR_OCCURED, err);
                                        return res.type("application/json").status(200).send({
                                            error: false,
                                            data: result.rows,
                                            withdraw: dataWithdraw.rows,
                                            yesterdaySLP: dataYesterday.rows,
                                            managerEarned: []
                                        });
                                    } else {
                                        return res.type("application/json").status(200).send({
                                            error: false,
                                            data: result.rows,
                                            withdraw: dataWithdraw.rows,
                                            yesterdaySLP: dataYesterday.rows,
                                            managerEarned: dataManager.rows
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
})

// POST Method x Saving process of adding new scholar
router.post("/addEditScholar", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_INSERTQUERY);

        // Conect to postgres
        const client = new Client(pgConn);
        client.connect();
        
        // Body payload
        const payload = req.body;

        if (payload.ACTION === MESSAGE.INSERT) {
            // Execute Query x insert new team record
            const query = `${HEROKU.QUERY.INSERT.USERPROFILE} ("ADDRESS", "NAME", "EMAIL", "PASS", "SHR_MANAGER", "SHR_SCHOLAR", "SHR_SPONSOR", "SPONSOR_NAME", "STARTED_ON", "SLP_CLAIMED", "DELETEIND") VALUES ('${payload.ADDRESS}', '${payload.NAME}', '${payload.EMAIL}', '${payload.PASS}', '${payload.SHR_MANAGER}', '${payload.SHR_SCHOLAR}', '${payload.SHR_SPONSOR}', '${payload.SPONSOR_NAME}', '${payload.STARTED_ON}', '0', '')`;
            client.query(query, (error) => {
                req.logger.info(MESSAGE.TEAMRECORD, MESSAGE.STARTED_INSERTQUERY);
                if (error) {
                    req.logger.error(MESSAGE.TEAMRECORD, MESSAGE.END_INSERTQUERY, error);
                    // End Connection
                    client.end();
                    return res.type("application/json").status(500).send({
                        error: true,
                        data: error
                    });
                } else {
                    // Execute Query x insert new daily slp record
                    const query = `${HEROKU.QUERY.INSERT.DAILYSLP} ("ADDRESS", "YESTERDAY", "YESTERDAYRES", "TODAY", "TODATE") VALUES ('${payload.ADDRESS}', '0', '0', '0','${payload.STARTED_ON}')`;
                    client.query(query, (err, result) => {
                        req.logger.info(MESSAGE.DAILYSLP, MESSAGE.STARTED_INSERTQUERY);
                        // End Connection
                        client.end();
                        if (err) {
                            req.logger.error(MESSAGE.DAILYSLP, MESSAGE.END_INSERTQUERY, err);
                            return res.type("application/json").status(500).send({
                                error: true,
                                data: err
                            });
                        } else {
                            req.logger.info(MESSAGE.DAILYSLP, MESSAGE.END_INSERTQUERY);
                            return res.type("application/json").status(200).send({
                                error: false,
                                data: result
                            });
                        }
                    });
                }
            });
        } else if (payload.ACTION === MESSAGE.UPDATE) {
            // Execute Query x update team record
            const query = `${HEROKU.QUERY.UPDATE.USERPROFILE} SET "ADDRESS" = '${payload.ADDRESS}', "NAME" = '${payload.NAME}', "EMAIL" = '${payload.EMAIL}', "PASS" = '${payload.PASS}', "SHR_MANAGER" = '${payload.SHR_MANAGER}', "SHR_SCHOLAR" = '${payload.SHR_SCHOLAR}', "SHR_SPONSOR" = '${payload.SHR_SPONSOR}', "SPONSOR_NAME" = '${payload.SPONSOR_NAME}', "DELETEIND" = '${payload.DELETEIND}' WHERE "ADDRESS" = '${payload.ADDRESS}'`;
            client.query(query, (error, result) => {
                req.logger.info(MESSAGE.STARTED_UPDATEQUERY, payload.ADDRESS);
                // End Connection
                client.end();
                if (error) {
                    req.logger.error(MESSAGE.USERPROFILE, MESSAGE.END_UPDATEQUERY, error);
                    return res.type("application/json").status(500).send({
                        error: true,
                        data: error
                    });
                } else {
                    req.logger.info(MESSAGE.USERPROFILE, MESSAGE.END_UPDATEQUERY);
                    return res.type("application/json").status(200).send({
                        error: false,
                        data: result
                    });
                }
            });
        } else {
            req.logger.error(MESSAGE.ERROR_PROCEDURE);
            return res.type("application/json").status(500).send({
                error: true,
                data: MESSAGE.ERROR_PROCEDURE
            });
        }
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// POST Method x Saving process of Daily SLP x Yesterday and Today
router.post("/dailySLP", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_INSERTQUERY);

        // Body payload
        const payload = req.body;

        if (payload.length > 0) {
            // Map the payload for multiple data
            const upsertProcedure = payload.map((items) => {
                // Conect to postgres
                const client = new Client(pgConn);
                client.connect();

                // Execute Query for Daily SLP
                req.logger.info(MESSAGE.STARTED_UPDATEQUERY, items.ADDRESS);
                let query = `${HEROKU.QUERY.UPDATE.DAILYSLP} SET "YESTERDAY" = '${items.YESTERDAY}', "YESTERDAYRES" = '${items.YESTERDAYRES}', "TODAY" = '${items.TODAY}', "TODATE" = '${items.TODATE}' WHERE "ADDRESS" = '${items.ADDRESS}'`;
                if (!items.ALLFIELDS) { // False, only TODATE SLP will be updating
                    query = `${HEROKU.QUERY.UPDATE.DAILYSLP} SET "TODAY" = '${items.TODAY}' WHERE "ADDRESS" = '${items.ADDRESS}'`;
                }

                client.query(query, (error) => {
                    req.logger.info(MESSAGE.END_UPDATEQUERY, items.ADDRESS);
                    if (error) {
                        // End Connection
                        client.end();
                        req.logger.error(MESSAGE.ERROR_PROCEDURE, error);
                    } else {
                        if (items.TBINSERTYESTERDAY) {
                            if (Number(items.YESTERDAYRES) > 0 && Number(items.YESTERDAYRES) <= Number(items.MAXGAINSLP)) { // Insert all positive value x greater than zero
                                // Execute Query for insert Yesterday SLP
                                const insertQuery = `${HEROKU.QUERY.INSERT.YESTERDAYSLP} ("ADDRESS", "YESTERDAY", "DATE_ON", "MMR") VALUES ('${items.ADDRESS}', '${items.YESTERDAYRES}', '${items.YESTERDAYDATE}', '${items.MMR}')`;
                                client.query(insertQuery, (error) => {
                                    req.logger.info(MESSAGE.END_INSERTQUERY, items.ADDRESS);
                                    // End Connection
                                    client.end();
                                    if (error) {
                                        req.logger.error(MESSAGE.ERROR_PROCEDURE, error);
                                    }
                                });
                            } else {
                                // End Connection
                                client.end();
                            }
                        } else if (items.TBUPDATEHIGHSLP) { // Update High SLP Gained
                            // Execute Query x update team record
                            if (Number(items.HIGHSLPGAIN) > 0 && Number(items.HIGHSLPGAIN) <= Number(items.MAXGAINSLP)) { // Insert all positive value x greater than zero
                                const query = `${HEROKU.QUERY.UPDATE.USERPROFILE} SET "HIGH_SLP_GAIN" = '${items.HIGHSLPGAIN}', "HIGH_SLP_DATE" = '${items.HIGHSLPDATE}' WHERE "ADDRESS" = '${items.ADDRESS}'`;
                                client.query(query, (error) => {
                                    req.logger.info(MESSAGE.STARTED_UPDATEQUERY, items.ADDRESS);
                                    // End Connection
                                    client.end();
                                    if (error) {
                                        req.logger.error(MESSAGE.ERROR_PROCEDURE, error);
                                    }
                                });
                            }
                        } else {
                            // End Connection
                            client.end();
                        }
                    }
                });
            });

            // Return
            return await Promise.all(upsertProcedure).then(function () {
                req.logger.info(MESSAGE.END_UPDATEQUERY);
                return res.type("application/json").status(200).send({
                    error: false,
                    data: payload
                });
            });
        } else {
            req.logger.error(MESSAGE.EMPTYPAYLOAD);
            return res.type("application/json").status(400).send({
                error: true,
                data: MESSAGE.EMPTYPAYLOAD
            });
        }
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// POST Method x Saving process of Update SLP Claimed in USER PROFILE Table
router.post("/updateSLPClaimed", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_INSERTQUERY);

        // Body payload
        const payload = req.body;

        if (payload.length > 0) {
            // Map the payload for multiple data
            const upsertProcedure = payload.map((items) => {
                // Conect to postgres
                const client = new Client(pgConn);
                client.connect();

                // Execute Query for Daily SLP
                req.logger.info(MESSAGE.STARTED_UPDATEQUERY, items.ADDRESS);
                query = `${HEROKU.QUERY.UPDATE.USERPROFILE} SET "SLP_CLAIMED" = '${items.SLP_CLAIMED}' WHERE "ADDRESS" = '${items.ADDRESS}'`;
                client.query(query, (error) => {
                    req.logger.info(MESSAGE.END_UPDATEQUERY, items.ADDRESS);
                    // End Connection
                    client.end();
                    if (error) {
                        req.logger.error(MESSAGE.ERROR_PROCEDURE, error);
                    }
                });
            });

            // Return
            return await Promise.all(upsertProcedure).then(function () {
                req.logger.info(MESSAGE.END_UPDATEQUERY);
                return res.type("application/json").status(200).send({
                    error: false,
                    data: payload
                });
            });
        } else {
            req.logger.error(MESSAGE.EMPTYPAYLOAD);
            return res.type("application/json").status(400).send({
                error: true,
                data: MESSAGE.EMPTYPAYLOAD
            });
        }
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// POST Method x Deletion process of YESTERDAY SLP x Delete the old data
router.post("/deleteYesterdaySLP", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_DELETEQUERY);

        // Body payload
        const payload = req.body;

        if (payload.length > 0) {
            // Map the payload for multiple data
            const upsertProcedure = payload.map((items) => {
                // Conect to postgres
                const client = new Client(pgConn);
                client.connect();

                // Execute Query for Daily SLP
                req.logger.info(MESSAGE.STARTED_DELETEQUERY, items.ADDRESS);
                query = `${HEROKU.QUERY.DELETE.YESTERDAYSLP} WHERE "ID" = '${items.ID}'`;
                client.query(query, (error) => {
                    req.logger.info(MESSAGE.END_DELETEQUERY, items.ADDRESS);
                    // End Connection
                    client.end();
                    if (error) {
                        req.logger.error(MESSAGE.ERROR_PROCEDURE, error);
                    }
                });
            });

            // Return
            return await Promise.all(upsertProcedure).then(function () {
                req.logger.info(MESSAGE.END_DELETEQUERY);
                return res.type("application/json").status(200).send({
                    error: false,
                    data: payload
                });
            });
        } else {
            req.logger.error(MESSAGE.EMPTYPAYLOAD);
            return res.type("application/json").status(400).send({
                error: true,
                data: MESSAGE.EMPTYPAYLOAD
            });
        }
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// POST Method x Saving process of team withdraw
router.post("/withdraw", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_INSERTQUERY);

        // Conect to postgres
        const client = new Client(pgConn);
        client.connect();
        
        // Body payload
        const payload = req.body;

        // Execute Query x insert new team record
        const query = `${HEROKU.QUERY.INSERT.WITHDRAW} ("ADDRESS", "SLPTOTAL", "SLPCURRENCY", "WITHDRAW_ON") VALUES ('${payload.ADDRESS}', '${payload.SLPTOTAL}', '${payload.SLPCURRENCY}', '${payload.WITHDRAW_ON}')`;
        client.query(query, (error, result) => {
            req.logger.info(MESSAGE.WITHDRAW, MESSAGE.STARTED_INSERTQUERY);
            // End Connection
            client.end();
            if (error) {
                req.logger.error(MESSAGE.WITHDRAW, MESSAGE.END_INSERTQUERY, error);
                return res.type("application/json").status(500).send({
                    error: true,
                    data: error
                });
            } else {
                req.logger.info(MESSAGE.WITHDRAW, MESSAGE.END_INSERTQUERY);
                return res.type("application/json").status(200).send({
                    error: false,
                    data: result
                });
            }
        });
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// POST Method x Saving process of manager earned
router.post("/managerEarned", async (req, res) => {
    try {
        req.logger.info(MESSAGE.STARTED_INSERTQUERY);

        // Conect to postgres
        const client = new Client(pgConn);
        client.connect();
        
        // Body payload
        const payload = req.body;

        // Execute Query x insert new team record
        const query = `${HEROKU.QUERY.INSERT.MANAGEREARNED} ("SLPTOTAL", "SLPCURRENCY", "CATEGORY", "EARNED_ON") VALUES ('${payload.SLPTOTAL}', '${payload.SLPCURRENCY}', '${payload.CATEGORY}', '${payload.EARNED_ON}')`;
        client.query(query, (error, result) => {
            req.logger.info(MESSAGE.MANAGER_EARNED, MESSAGE.STARTED_INSERTQUERY);
            // End Connection
            client.end();
            if (error) {
                req.logger.error(MESSAGE.MANAGER_EARNED, MESSAGE.END_INSERTQUERY, error);
                return res.type("application/json").status(500).send({
                    error: true,
                    data: error
                });
            } else {
                req.logger.info(MESSAGE.MANAGER_EARNED, MESSAGE.END_INSERTQUERY);
                return res.type("application/json").status(200).send({
                    error: false,
                    data: result
                });
            }
        });
    } catch (err) {
        req.logger.error(MESSAGE.ERROR_OCCURED, err);
        return res.type("application/json").status(500).send({
            error: true,
            data: err
        });
    }
});

// Export the API container
module.exports = router;