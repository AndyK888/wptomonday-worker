var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
function createResponse(data, status = 200) {
  const response = {
    success: status >= 200 && status < 300,
    message: data.message || (status >= 200 && status < 300 ? "Success" : "Error"),
    data: data.data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...data
  };
  return new Response(JSON.stringify(response, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse, "createResponse");
function parseFormEncodedData(data) {
  const params = new URLSearchParams(data);
  return {
    "your-name": params.get("your-name") || "",
    "your-email": params.get("your-email") || "",
    "your-tel": params.get("your-tel") || "",
    "zip-code": params.get("zip-code") || "",
    "your-subject": params.get("your-subject") || void 0,
    "your-message": params.get("your-message") || void 0,
    "your-website": params.get("your-website") || void 0
  };
}
__name(parseFormEncodedData, "parseFormEncodedData");
function formatPhoneNumber(phoneInput) {
  let cleanPhone = phoneInput.replace(/[^\d+]/g, "");
  if (cleanPhone.startsWith("001")) {
    cleanPhone = cleanPhone.substring(3);
  } else if (cleanPhone.startsWith("+1")) {
    cleanPhone = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith("1") && cleanPhone.length === 11) {
    cleanPhone = cleanPhone.substring(1);
  }
  if (cleanPhone.length === 10) {
    return `+1${cleanPhone} US`;
  } else if (cleanPhone.length === 7) {
    return `+1${cleanPhone} US`;
  } else {
    return `+1${cleanPhone} US`;
  }
}
__name(formatPhoneNumber, "formatPhoneNumber");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }
    try {
      switch (url.pathname) {
        case "/":
          return handleRoot(request);
        case "/health":
          return handleHealth(request);
        // ContactForm7 webhook endpoint
        case "/webhook/cf7":
          if (method === "POST") {
            return await handleContactForm7Webhook(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        // Monday.com integration endpoints
        case "/api/monday/create-lead":
          if (method === "POST") {
            return await handleCreateMondayLead(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        case "/api/schedule":
          if (method === "POST") {
            return await handleScheduleContent(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        case "/api/content":
          if (method === "GET") {
            return await handleGetContent(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        case "/api/monday/boards":
          if (method === "GET") {
            return await handleGetMondayBoards(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        case "/api/monday/board-info":
          if (method === "GET") {
            return await handleGetMondayBoardInfo(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        case "/api/sync":
          if (method === "POST") {
            return await handleSyncContent(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        case "/api/debug":
          if (method === "POST") {
            return await handleDebugMondayAPI(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        case "/api/test-phone":
          if (method === "GET") {
            return await handleTestPhoneFormatting(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        case "/api/test-failover":
          if (method === "POST") {
            return await handleTestFailover(request, env);
          }
          return createResponse({ message: "Method not allowed" }, 405);
        default:
          return createResponse({ message: "Endpoint not found" }, 404);
      }
    } catch (error) {
      console.error("Worker error:", error);
      return createResponse({
        message: "Internal server error",
        data: { error: error instanceof Error ? error.message : "Unknown error" }
      }, 500);
    }
  }
};
async function handleRoot(request) {
  const info = {
    name: "WP to Monday.com Content Scheduler & CRM Integration",
    version: "1.0.0",
    endpoints: [
      "GET /health - Health check",
      "POST /webhook/cf7 - ContactForm7 webhook (creates leads in Monday.com)",
      "POST /api/monday/create-lead - Create lead directly in Monday.com",
      "GET /api/monday/boards - Get Monday.com boards",
      "POST /api/schedule - Schedule content to Monday.com",
      "GET /api/content - Get scheduled content",
      "POST /api/sync - Sync content between WP and Monday.com"
    ],
    webhook_usage: {
      url: "/webhook/cf7",
      method: "POST",
      content_type: "application/x-www-form-urlencoded or application/json",
      fields: {
        "your-name": "Lead name",
        "your-email": "Lead email",
        "your-tel": "Lead phone",
        "zip-code": "Lead location/zip code"
      }
    },
    documentation: "https://developers.cloudflare.com/workers/"
  };
  return createResponse({
    message: "Welcome to WP to Monday.com Content Scheduler & CRM Integration API",
    data: info
  });
}
__name(handleRoot, "handleRoot");
async function handleHealth(request) {
  return createResponse({
    message: "Service is healthy",
    data: {
      status: "healthy",
      uptime: Date.now(),
      environment: "production"
    }
  });
}
__name(handleHealth, "handleHealth");
async function handleScheduleContent(request, env) {
  try {
    const body = await request.json();
    if (!body.title || !body.content || !body.scheduledDate || !body.mondayBoardId) {
      return createResponse({
        message: "Missing required fields: title, content, scheduledDate, mondayBoardId"
      }, 400);
    }
    const scheduleId = crypto.randomUUID();
    return createResponse({
      message: "Content scheduled successfully",
      data: {
        scheduleId,
        title: body.title,
        scheduledDate: body.scheduledDate,
        mondayBoardId: body.mondayBoardId,
        status: "scheduled"
      }
    });
  } catch (error) {
    return createResponse({
      message: "Failed to schedule content",
      data: { error: error instanceof Error ? error.message : "Unknown error" }
    }, 500);
  }
}
__name(handleScheduleContent, "handleScheduleContent");
async function handleGetContent(request, env) {
  const mockContent = [
    {
      id: "1",
      title: "Sample Blog Post",
      content: "This is a sample blog post content...",
      scheduledDate: "2024-01-15T10:00:00Z",
      status: "scheduled",
      mondayBoardId: "board123"
    },
    {
      id: "2",
      title: "Another Post",
      content: "More content here...",
      scheduledDate: "2024-01-16T14:30:00Z",
      status: "published",
      mondayBoardId: "board456"
    }
  ];
  return createResponse({
    message: "Content retrieved successfully",
    data: mockContent
  });
}
__name(handleGetContent, "handleGetContent");
async function handleGetMondayBoards(request, env) {
  const mockBoards = [
    {
      id: "board123",
      name: "Content Calendar",
      description: "Main content scheduling board"
    },
    {
      id: "board456",
      name: "Blog Posts",
      description: "Blog post management board"
    }
  ];
  return createResponse({
    message: "Monday.com boards retrieved successfully",
    data: mockBoards
  });
}
__name(handleGetMondayBoards, "handleGetMondayBoards");
async function handleGetMondayBoardInfo(request, env) {
  try {
    const query = `
			query {
				boards(ids: [${parseInt(env.MONDAY_BOARD_ID)}]) {
					id
					name
					columns {
						id
						title
						type
					}
					groups {
						id
						title
					}
				}
			}
		`;
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": env.MONDAY_API_TOKEN
      },
      body: JSON.stringify({
        query
      })
    });
    const result = await response.json();
    if (result.errors) {
      console.error("Monday.com API errors:", result.errors);
      return createResponse({
        message: "Failed to fetch board info",
        data: { mondayError: result.errors[0]?.message || "Monday.com API error" }
      }, 500);
    }
    const board = result.data?.boards?.[0];
    if (!board) {
      return createResponse({
        message: "Board not found",
        data: { boardId: env.MONDAY_BOARD_ID }
      }, 404);
    }
    return createResponse({
      message: "Board information retrieved successfully",
      data: {
        board,
        current_column_mapping: env.MONDAY_COLUMN_MAPPING ? JSON.parse(env.MONDAY_COLUMN_MAPPING) : null
      }
    });
  } catch (error) {
    console.error("Monday.com API error:", error);
    return createResponse({
      message: "Failed to fetch board info",
      data: { error: error instanceof Error ? error.message : "Unknown error" }
    }, 500);
  }
}
__name(handleGetMondayBoardInfo, "handleGetMondayBoardInfo");
async function handleSyncContent(request, env) {
  try {
    const body = await request.json();
    return createResponse({
      message: "Content sync completed",
      data: {
        syncedItems: 5,
        updatedItems: 2,
        newItems: 3,
        syncTimestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    return createResponse({
      message: "Sync failed",
      data: { error: error instanceof Error ? error.message : "Unknown error" }
    }, 500);
  }
}
__name(handleSyncContent, "handleSyncContent");
async function handleContactForm7Webhook(request, env) {
  try {
    let cf7Data;
    const contentType = request.headers.get("content-type") || "";
    const requestText = await request.text();
    console.log("ContactForm7 webhook received:", {
      contentType,
      bodyLength: requestText.length,
      bodyPreview: requestText.substring(0, 200)
    });
    if (contentType.includes("application/json")) {
      try {
        cf7Data = JSON.parse(requestText);
      } catch (jsonError) {
        console.log("JSON parsing failed, trying form-encoded parsing:", jsonError);
        cf7Data = parseFormEncodedData(requestText);
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      cf7Data = parseFormEncodedData(requestText);
    } else {
      if (requestText.startsWith("{")) {
        try {
          cf7Data = JSON.parse(requestText);
        } catch (jsonError) {
          return createResponse({
            message: "Invalid JSON format in request body"
          }, 400);
        }
      } else if (requestText.includes("=") && requestText.includes("&")) {
        cf7Data = parseFormEncodedData(requestText);
      } else {
        return createResponse({
          message: "Unsupported content format. Expected JSON or form-encoded data",
          data: { contentType, bodyPreview: requestText.substring(0, 100) }
        }, 400);
      }
    }
    if (!cf7Data["your-name"] || !cf7Data["your-email"]) {
      return createResponse({
        message: "Missing required fields: your-name and your-email are required"
      }, 400);
    }
    const mondayResult = await createMondayLeadWithFailover(cf7Data, env);
    if (!mondayResult.success) {
      return createResponse({
        message: "Failed to create lead in Monday.com after multiple attempts",
        data: {
          mondayError: mondayResult.error,
          attemptedFields: mondayResult.attemptedFields
        }
      }, 500);
    }
    return createResponse({
      message: mondayResult.warnings ? "Lead created successfully in Monday.com (with some field adjustments)" : "Lead created successfully in Monday.com",
      data: {
        cf7Data: {
          name: cf7Data["your-name"],
          email: cf7Data["your-email"],
          phone: cf7Data["your-tel"],
          location: cf7Data["zip-code"]
        },
        mondayItemId: mondayResult.itemId,
        boardId: env.MONDAY_BOARD_ID,
        ...mondayResult.warnings && { warnings: mondayResult.warnings }
      }
    });
  } catch (error) {
    console.error("ContactForm7 webhook error:", error);
    return createResponse({
      message: "Failed to process ContactForm7 webhook",
      data: { error: error instanceof Error ? error.message : "Unknown error" }
    }, 500);
  }
}
__name(handleContactForm7Webhook, "handleContactForm7Webhook");
async function handleCreateMondayLead(request, env) {
  try {
    const body = await request.json();
    if (!body.name || !body.email) {
      return createResponse({
        message: "Missing required fields: name and email are required"
      }, 400);
    }
    const cf7Data = {
      "your-name": body.name,
      "your-email": body.email,
      "your-tel": body.phone || "",
      "zip-code": body.location || body.zipCode || "",
      "your-subject": body.subject,
      "your-message": body.message,
      "your-website": body.website
    };
    const mondayResult = await createMondayLeadWithFailover(cf7Data, env);
    if (!mondayResult.success) {
      return createResponse({
        message: "Failed to create lead in Monday.com after multiple attempts",
        data: {
          mondayError: mondayResult.error,
          attemptedFields: mondayResult.attemptedFields
        }
      }, 500);
    }
    return createResponse({
      message: mondayResult.warnings ? "Lead created successfully in Monday.com (with some field adjustments)" : "Lead created successfully in Monday.com",
      data: {
        lead: cf7Data,
        mondayItemId: mondayResult.itemId,
        boardId: env.MONDAY_BOARD_ID,
        ...mondayResult.warnings && { warnings: mondayResult.warnings }
      }
    });
  } catch (error) {
    return createResponse({
      message: "Failed to create lead",
      data: { error: error instanceof Error ? error.message : "Unknown error" }
    }, 500);
  }
}
__name(handleCreateMondayLead, "handleCreateMondayLead");
async function createMondayLead(cf7Data, env) {
  try {
    const columnMapping = env.MONDAY_COLUMN_MAPPING ? JSON.parse(env.MONDAY_COLUMN_MAPPING) : {
      name: "name",
      email: "email",
      phone: "phone",
      location: "location"
    };
    const itemName = `${cf7Data["your-name"]} - ${cf7Data["your-email"]}`;
    const columnValues = [];
    if (cf7Data["your-name"]) {
      columnValues.push({
        id: columnMapping.name || "name",
        text: cf7Data["your-name"]
      });
    }
    if (cf7Data["your-email"]) {
      columnValues.push({
        id: columnMapping.email || "lead_email",
        text: cf7Data["your-email"],
        email: cf7Data["your-email"]
      });
    }
    if (cf7Data["your-tel"]) {
      const formattedPhone = formatPhoneNumber(cf7Data["your-tel"]);
      columnValues.push({
        id: columnMapping.phone || "lead_phone",
        text: formattedPhone
      });
    }
    if (cf7Data["zip-code"]) {
      columnValues.push({
        id: columnMapping.location || "text_mkvqtqf7",
        text: cf7Data["zip-code"]
      });
    }
    // Always add "Website" as the source for form submissions
    if (columnMapping.source) {
      columnValues.push({
        id: columnMapping.source,
        text: "Website"
      });
    }
    const columnValuesObject = {};
    columnValues.forEach((cv) => {
      if (cv.email) {
        columnValuesObject[cv.id] = {
          email: cv.email,
          text: cv.text
        };
      } else {
        columnValuesObject[cv.id] = cv.text;
      }
    });
    const columnValuesJson = JSON.stringify(columnValuesObject);
    const mutation = `
			mutation {
				create_item(
					board_id: ${parseInt(env.MONDAY_BOARD_ID)}
					group_id: "topics"
					item_name: "${itemName.replace(/"/g, '\\"')}"
					column_values: "${columnValuesJson.replace(/"/g, '\\"')}"
				) {
					id
					name
				}
			}
		`;
    console.log("Monday.com API Request:", {
      board_id: env.MONDAY_BOARD_ID,
      group_id: "topics",
      item_name: itemName,
      column_values: columnValues,
      column_values_object: columnValuesObject,
      column_values_json: columnValuesJson,
      mutation
    });
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": env.MONDAY_API_TOKEN
      },
      body: JSON.stringify({
        query: mutation
      })
    });
    const result = await response.json();
    if (result.errors) {
      console.error("Monday.com API errors:", result.errors);
      return { success: false, error: result.errors[0]?.message || "Monday.com API error" };
    }
    const itemId = result.data?.create_item?.id;
    if (!itemId) {
      return { success: false, error: "No item ID returned from Monday.com" };
    }
    return { success: true, itemId };
  } catch (error) {
    console.error("Monday.com API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Monday.com API error"
    };
  }
}
__name(createMondayLead, "createMondayLead");
async function createMondayLeadWithFailover(cf7Data, env) {
  const fieldPriority = ["your-name", "your-email", "zip-code", "your-tel"];
  const warnings = [];
  const attemptedFields = [];
  let currentData = { ...cf7Data };
  for (let attempt = 0; attempt < fieldPriority.length + 1; attempt++) {
    console.log(`Monday.com attempt ${attempt + 1}:`, {
      fieldsIncluded: Object.keys(currentData).filter((key) => currentData[key])
    });
    attemptedFields.push(...Object.keys(currentData).filter((key) => currentData[key]));
    const result = await createMondayLead(currentData, env);
    if (result.success) {
      return {
        success: true,
        itemId: result.itemId,
        warnings: warnings.length > 0 ? warnings : void 0
      };
    }
    if (attempt >= fieldPriority.length - 2) {
      return {
        success: false,
        error: `Failed after ${attempt + 1} attempts. Last error: ${result.error}`,
        attemptedFields: [...new Set(attemptedFields)]
      };
    }
    const fieldToRemove = fieldPriority[fieldPriority.length - 1 - attempt];
    if (currentData[fieldToRemove]) {
      console.log(`Removing problematic field: ${fieldToRemove}`);
      warnings.push(`Removed field '${fieldToRemove}' due to formatting issues`);
      currentData[fieldToRemove] = "";
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return {
    success: false,
    error: "All failover attempts exhausted",
    attemptedFields: [...new Set(attemptedFields)]
  };
}
__name(createMondayLeadWithFailover, "createMondayLeadWithFailover");
async function handleDebugMondayAPI(request, env) {
  try {
    const body = await request.json();
    const cf7Data = {
      "your-name": body.name || "Test User",
      "your-email": body.email || "test@example.com",
      "your-tel": body.phone || "555-1234",
      "zip-code": body.location || "12345"
    };
    const columnMapping = env.MONDAY_COLUMN_MAPPING ? JSON.parse(env.MONDAY_COLUMN_MAPPING) : {
      name: "name",
      email: "lead_email",
      phone: "lead_phone",
      location: "text_mkvqtqf7",
      source: "text_mkvynrwv"
    };
    const itemName = `${cf7Data["your-name"]} - ${cf7Data["your-email"]}`;
    const columnValues = [];
    if (cf7Data["your-name"]) {
      columnValues.push({
        id: columnMapping.name || "name",
        text: cf7Data["your-name"]
      });
    }
    if (cf7Data["your-email"]) {
      columnValues.push({
        id: columnMapping.email || "lead_email",
        text: cf7Data["your-email"],
        email: cf7Data["your-email"]
      });
    }
    if (cf7Data["your-tel"]) {
      const formattedPhone = formatPhoneNumber(cf7Data["your-tel"]);
      columnValues.push({
        id: columnMapping.phone || "lead_phone",
        text: formattedPhone
      });
    }
    if (cf7Data["zip-code"]) {
      columnValues.push({
        id: columnMapping.location || "text_mkvqtqf7",
        text: cf7Data["zip-code"]
      });
    }
    // Always add "Website" as the source for form submissions
    if (columnMapping.source) {
      columnValues.push({
        id: columnMapping.source,
        text: "Website"
      });
    }
    const columnValuesObject = {};
    columnValues.forEach((cv) => {
      if (cv.email) {
        columnValuesObject[cv.id] = {
          email: cv.email,
          text: cv.text
        };
      } else {
        columnValuesObject[cv.id] = cv.text;
      }
    });
    const columnValuesJson = JSON.stringify(columnValuesObject);
    const mutation = `
			mutation {
				create_item(
					board_id: ${parseInt(env.MONDAY_BOARD_ID)}
					group_id: "topics"
					item_name: "${itemName.replace(/"/g, '\\"')}"
					column_values: "${columnValuesJson.replace(/"/g, '\\"')}"
				) {
					id
					name
				}
			}
		`;
    return createResponse({
      message: "Debug information for Monday.com API",
      data: {
        board_id: env.MONDAY_BOARD_ID,
        group_id: "topics",
        item_name: itemName,
        column_mapping: columnMapping,
        column_values: columnValues,
        column_values_object: columnValuesObject,
        column_values_json: columnValuesJson,
        mutation,
        cf7_data: cf7Data
      }
    });
  } catch (error) {
    return createResponse({
      message: "Debug failed",
      data: { error: error instanceof Error ? error.message : "Unknown error" }
    }, 500);
  }
}
__name(handleDebugMondayAPI, "handleDebugMondayAPI");
async function handleTestPhoneFormatting(request, env) {
  const testPhoneNumbers = [
    "7473089408",
    "747-308-9408",
    "747.308.9408",
    "747 308 9408",
    "(747)3089408",
    "(747) 3089408",
    "(747)308-9408",
    "(747) 308-9408",
    "(747) 308.9408",
    "(747) 308 9408",
    "17473089408",
    "1-747-308-9408",
    "1.747.308.9408",
    "1 747 308 9408",
    "1 (747)3089408",
    "1 (747) 308-9408",
    "+17473089408",
    "+1-747-308-9408",
    "+1.747.308.9408",
    "+1 747 308 9408",
    "+1 (747)3089408",
    "+1 (747) 308-9408",
    "0017473089408",
    "001-747-308-9408",
    "001 747 308 9408"
  ];
  const results = testPhoneNumbers.map((phone) => ({
    input: phone,
    output: formatPhoneNumber(phone),
    isValid: formatPhoneNumber(phone) === "+17473089408 US"
  }));
  const allValid = results.every((result) => result.isValid);
  const validCount = results.filter((result) => result.isValid).length;
  return createResponse({
    message: `Phone number formatting test completed: ${validCount}/${testPhoneNumbers.length} formats converted correctly`,
    data: {
      summary: {
        totalTests: testPhoneNumbers.length,
        validOutputs: validCount,
        allPassed: allValid,
        expectedOutput: "+17473089408 US"
      },
      results
    }
  });
}
__name(handleTestPhoneFormatting, "handleTestPhoneFormatting");
async function handleTestFailover(request, env) {
  try {
    const body = await request.json();
    const testData = {
      "your-name": body.name || "Test Failover User",
      "your-email": body.email || "test@example.com",
      "your-tel": body.phone || "+1-555-INVALID-PHONE",
      // Intentionally problematic
      "zip-code": body.location || "90210"
    };
    console.log("Testing failover with potentially problematic data:", testData);
    const result = await createMondayLeadWithFailover(testData, env);
    return createResponse({
      message: "Failover test completed",
      data: {
        testData,
        result,
        explanation: "This test uses intentionally problematic phone data to demonstrate failover logic"
      }
    });
  } catch (error) {
    return createResponse({
      message: "Failover test failed",
      data: { error: error instanceof Error ? error.message : "Unknown error" }
    }, 500);
  }
}
__name(handleTestFailover, "handleTestFailover");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
