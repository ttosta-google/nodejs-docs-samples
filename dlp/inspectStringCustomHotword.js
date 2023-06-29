// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// sample-metadata:
//  title: Inspects a string for sensitive data.
//  description: Inspect a string for sensitive data using a custom hotword and increase the likelihood of match
//  usage: node inspectStringCustomHotword.js my-project string customHotword
function main(projectId, string, customHotword) {
  // [START dlp_inspect_string_custom_hotword]
  // Imports the Google Cloud Data Loss Prevention library
  const DLP = require('@google-cloud/dlp');

  // Instantiates a client
  const dlp = new DLP.DlpServiceClient();

  // The project ID to run the API call under
  // const projectId = 'my-project';

  // The string to inspect
  // const string = 'patient name: John Doe';

  // Custom hotward
  // const customHotword = 'patient';

  async function inspectStringCustomHotword() {
    // Specify the type and content to be inspected.
    const item = {
      byteItem: {
        type: DLP.protos.google.privacy.dlp.v2.ByteContentItem.BytesType
          .TEXT_UTF8,
        data: Buffer.from(string, 'utf-8'),
      },
    };

    // Increase likelihood of matches that have customHotword nearby.
    const hotwordRule = {
      hotwordRegex: {
        pattern: customHotword,
      },
      proximity: {
        windowBefore: 50,
      },
      likelihoodAdjustment: {
        fixedLikelihood:
          DLP.protos.google.privacy.dlp.v2.Likelihood.VERY_LIKELY,
      },
    };

    // Construct a ruleset that applies the hotword rule to the PERSON_NAME infotype.
    const ruleSet = [
      {
        infoTypes: [{name: 'PERSON_NAME'}],
        rules: [
          {
            hotwordRule: hotwordRule,
          },
        ],
      },
    ];

    // Construct the configuration for the Inspect request.
    const inspectConfig = {
      infoTypes: [{name: 'PERSON_NAME'}],
      ruleSet: ruleSet,
      includeQuote: true,
    };

    // Construct the Inspect request to be sent by the client.
    const request = {
      parent: `projects/${projectId}/locations/global`,
      inspectConfig: inspectConfig,
      item: item,
    };

    // Use the client to send the API request.
    const [response] = await dlp.inspectContent(request);

    // Print findings.
    const findings = response.result.findings;
    if (findings.length > 0) {
      console.log(`Findings: ${findings.length}\n`);
      findings.forEach(finding => {
        console.log(`InfoType: ${finding.infoType.name}`);
        console.log(`\tQuote: ${finding.quote}`);
        console.log(`\tLikelihood: ${finding.likelihood} \n`);
      });
    } else {
      console.log('No findings.');
    }
  }
  inspectStringCustomHotword();
  // [END dlp_inspect_string_custom_hotword]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));
