#Elastic API

API bridging mysql and elasticsearch. Performs aggregations on multiple tables, in order to store documents which can then be easily retrieved by the overviews.

The API can be controlled either using a REST API, or via an AMQP server (i.e. RabbitMQ)

## Requirements

* NodeJS >= 0.10.32
* npm >= 1.4.28
* ElasticSearch >= 1.3.2

## Deployment

Clone this repository, go inside the cloned folder, and create a `settings.json` file to configure the application (see Configuration section)

Install the dependencies and initialise ElasticSearch :

    npm install
    ./bin/init

Start the API server / Rabbit Consumer

    ./bin/www

For production deployment, use pm2 to start the server as a daemon

    sudo npm install pm2 -g
    sudo pm2 start ecosystem.json --env production
    sudo pm2 startup ubuntu
    sudo pm2 save

The `--env production` makes the API run in production mode, so no stack trace will be printed when an error occur

## Usage

### Initialization of ElasticSearch

Simply run the following command from the source folder

    bin/init

This will create the elasticsearch index, and index all aggregations declared in the `settings.json` file.

This command-line tool accepts multiple parameters, to show the possibilities, type

    bin/init -h

### AMQP Protocol (RabbitMQ)

Each production can subscribe to a RabbitMQ queue (see Configuration section).

When a campaign should be updated, a new message should be sent to the queue, and have the following format :

    {
        type: "campaigns", // Type of the overview (e.g. Campaigns, Ads, DIP ...)
        id: 72 // ID of the object in MySQL
    }

### API Endpoints

This API works in a REST scheme

#### Creating an index (not necessary if you have used `bin/init`)

    /overview/:production/init

#### Indexing a single document

    /overview/:production/index/:type/:id

Indexes a document of the given type with the given id in the given production.
Documents linked with this document will also be indexed.

Example :

    /overview/rcs/index/campaigns/72

#### Indexing all documents

    /overview/:production/index_all/:type

Indexes all documents of the give type for the given production.
Documents linked to document that are indexed this way will NOT be updated (for performance reasons).

#### Indexing metrics for a single document following an aggregation scheme

    /metrics/:production/type/:type/:id

Indexes the metrics of a single document giving its :id and its associated :production following the aggregation scheme :type.

Example :

    /metrics/rcs/type/dip_inventory_metrics/31214

#### Indexing metrics for all documents following an aggregation scheme

    /metrics/:production/type/:type/

Indexes the metrics of all documents giving their associated :production following the aggregation scheme :type.

Example :

    /metrics/rcs/type/dip_inventory_metrics

### Configuration

To configure the application, copy the `settings_examples.json` file to `settings.json`, then edit it.

#### Structure

    {
        "productions": { // Each production is a key of the productions object
            "rcs": {
                "mysql": { // MySQL Configuration
                    "host": "localhost",
                    "port": 3306,
                    "username": "root",
                    "password": "root",
                    "database": "adlogix-rcs"
                },
                "elasticsearch": { // ElasticSearch server configuration
                    "host": "localhost",
                    "port": 9200,
                    "index": "adlogix_rcs"
                },
                "rabbit": { // RabbitMQ queue to which the API will subscribe
                    "host": "localhost",
                    "port": 5672,
                    "username": "guest",
                    "password": "guest",
                    "queue": "test",
                    "bulk_size": 10 // Maximum number of concurrent indexation request per instance of the application (0 disables throttling)
                },
                "aggregations": { // Each overview type is a key of aggregations
                    "campaigns": {
                        "listSQL": "sql/campaigns/getCampaigns.sql", // This sql file lists the objects
                        "aggregationSQL": "sql/campaigns/aggs/", // This folder contains files that perform aggregations that will hydrate the object
                        "searchable_fields": ["name", "order_company"] // These fields will be appended a ".lowercase" subfield used for partial matching search
                    },
                    "dip": {
                        "listSQL": "sql/dip/getDIPs.sql",
                        "aggregationSQL": "sql/dip/aggs/",                       ],
                        "updates": { // This tells the application to update the campaign corresponding
                                     // to the user_campaign_id of the dip when a dip is updated
                            "campaigns": "user_campaign_id"
                        }
                    }
                }
            }
        },
        "api": { // REST API configuration
            "active": false,
            "port": 3000
        },
        "log4js": { // Logger configuration
            "appenders": [
                {"type": "console"}
            ],
            "levels": {
                "[all]": "INFO" // Set to "DEBUG" to see all debugging messages
            }
        },
        "newrelic": { // New Relic Configuration
            "license_key": "",
            "logging": "trace"
        },
        "metricsAggSchemes": [ // list of all the schemes used to aggregate the different metrics
            {
                "aggregateTo": {
                    "name": "adlogix_users_campaigns_selections_conf",
                    "id": "id"
                },
                "pathToMetrics":{
                    "name": "adlogix_inventory",
                    "id": "id",
                    "parentLink": "user_campaign_selection_conf_id",
                    "child": {
                        "name": "adlogix_inventory_data",
                        "parentLink": "inventory_id",
                        "metrics": [
                            "actual_imps",
                            "budget_net"
                        ],
                        "dateRangeAttribute": "datetime"
                    }
                },
                "aggregationName": "dip_inventory_metrics"
            }
        ]
    }

#### SQL

More info about the SQL files and structure can be found on the [wiki page](https://bitbucket.org/adlogix-ondemand/elastic-api/wiki/SQL%20Files)

## Development

### Testing

All tests can be found in the `/test` directory.
You can launch all tests by typing

    make test

from the console.

The test logger will output debug messages to the console in order to debug the application. You can configure it in `/test/index.js`.

The test reporter defines the way mocha reports successful and failed tests, it can be set up in the `Makefile`.

### Directory structure

More informations about the directory structure can be found on the [wiki page](https://bitbucket.org/adlogix-ondemand/elastic-api/wiki/Directory%20Structure).
