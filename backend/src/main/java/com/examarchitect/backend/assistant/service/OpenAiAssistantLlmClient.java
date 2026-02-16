package com.examarchitect.backend.assistant.service;

import com.examarchitect.backend.assistant.config.AssistantProperties;
import com.examarchitect.backend.assistant.dto.AssistantConversationTurnDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class OpenAiAssistantLlmClient implements AssistantLlmClient {

  private static final Logger LOGGER = LoggerFactory.getLogger(OpenAiAssistantLlmClient.class);
  private static final String RESPONSE_SCHEMA = """
      {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "reply": { "type": "string" },
          "keyPoints": {
            "type": "array",
            "items": { "type": "string" },
            "maxItems": 5
          },
          "nextActions": {
            "type": "array",
            "items": { "type": "string" },
            "maxItems": 5
          }
        },
        "required": ["reply", "keyPoints", "nextActions"]
      }
      """;
  private static final String SYSTEM_PROMPT = """
      You are the Exam Architect AI assistant.
      Use only the JSON context provided by the user prompt.
      Do not invent any data that is not present in context.
      If context is insufficient, explicitly state uncertainty.
      Keep answers concise, actionable, and exam-oriented.
      Return output strictly in the provided JSON schema.
      """;

  private final AssistantProperties assistantProperties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public OpenAiAssistantLlmClient(AssistantProperties assistantProperties, ObjectMapper objectMapper) {
    this.assistantProperties = assistantProperties;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofMillis(Math.max(1000, assistantProperties.getTimeoutMs())))
        .build();
  }

  @Override
  public Optional<AssistantLlmResponse> generateReply(
      String actorRole,
      String message,
      List<AssistantConversationTurnDto> history,
      String contextJson
  ) {
    if (!assistantProperties.isEnabled() || isBlank(assistantProperties.getApiKey())) {
      return Optional.empty();
    }

    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(normalizeBaseUrl(assistantProperties.getBaseUrl()) + "/chat/completions"))
          .header("Authorization", "Bearer " + assistantProperties.getApiKey())
          .header("Content-Type", "application/json")
          .timeout(Duration.ofMillis(Math.max(2000, assistantProperties.getTimeoutMs())))
          .POST(HttpRequest.BodyPublishers.ofString(buildRequestBody(actorRole, message, history, contextJson)))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        LOGGER.warn("OpenAI chat completion failed with status {}", response.statusCode());
        return Optional.empty();
      }

      return extractResponse(response.body());
    } catch (Exception ex) {
      LOGGER.warn("OpenAI chat completion call failed: {}", ex.getMessage());
      return Optional.empty();
    }
  }

  private String buildRequestBody(
      String actorRole,
      String message,
      List<AssistantConversationTurnDto> history,
      String contextJson
  ) throws Exception {
    ObjectNode root = objectMapper.createObjectNode();
    root.put("model", assistantProperties.getModel());
    root.put("temperature", 0.2);

    ArrayNode messagesNode = root.putArray("messages");
    messagesNode.addObject()
        .put("role", "system")
        .put("content", SYSTEM_PROMPT);

    for (AssistantConversationTurnDto turn : history) {
      String normalizedRole = "assistant".equalsIgnoreCase(turn.role()) ? "assistant" : "user";
      messagesNode.addObject()
          .put("role", normalizedRole)
          .put("content", turn.content());
    }

    String userPrompt = """
        Actor role: %s
        User question:
        %s

        Trusted analytics context JSON:
        %s
        """.formatted(actorRole, message, contextJson);

    messagesNode.addObject()
        .put("role", "user")
        .put("content", userPrompt);

    ObjectNode responseFormat = root.putObject("response_format");
    responseFormat.put("type", "json_schema");
    ObjectNode jsonSchemaNode = responseFormat.putObject("json_schema");
    jsonSchemaNode.put("name", "exam_assistant_response");
    jsonSchemaNode.put("strict", true);
    jsonSchemaNode.set("schema", objectMapper.readTree(RESPONSE_SCHEMA));

    return objectMapper.writeValueAsString(root);
  }

  private Optional<AssistantLlmResponse> extractResponse(String rawResponse) {
    try {
      JsonNode root = objectMapper.readTree(rawResponse);
      JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
      if (contentNode.isMissingNode() || contentNode.isNull() || contentNode.asText().isBlank()) {
        return Optional.empty();
      }

      JsonNode structured = objectMapper.readTree(contentNode.asText());
      String reply = structured.path("reply").asText("").trim();
      if (reply.isBlank()) {
        return Optional.empty();
      }

      List<String> keyPoints = readStringArray(structured.path("keyPoints"), 5);
      List<String> nextActions = readStringArray(structured.path("nextActions"), 5);
      return Optional.of(new AssistantLlmResponse(reply, keyPoints, nextActions));
    } catch (Exception ex) {
      LOGGER.warn("OpenAI response parsing failed: {}", ex.getMessage());
      return Optional.empty();
    }
  }

  private List<String> readStringArray(JsonNode node, int limit) {
    if (!node.isArray()) {
      return List.of();
    }

    List<String> items = new ArrayList<>();
    for (JsonNode child : node) {
      String text = child.asText("").trim();
      if (!text.isBlank()) {
        items.add(text);
      }
      if (items.size() == limit) {
        break;
      }
    }
    return items;
  }

  private String normalizeBaseUrl(String baseUrl) {
    String resolved = isBlank(baseUrl) ? "https://api.openai.com/v1" : baseUrl.trim();
    return resolved.endsWith("/") ? resolved.substring(0, resolved.length() - 1) : resolved;
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
