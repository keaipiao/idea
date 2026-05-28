package com.ideabox.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ideabox.api.common.ResultCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

@org.springframework.transaction.annotation.Transactional
class IdeaIntegrationTest extends IntegrationTestBase {

    @Test
    @DisplayName("金路径:创建项目 → 创建想法 → 标记完成 → 取消完成 → 删除")
    void ideaGoldenPath() throws Exception {
        String token = devUserToken();

        // 1) 建项目
        var createProjectResp = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"idea-pj\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long projectId = objectMapper.readTree(createProjectResp).path("data").path("id").asLong();

        // 2) 建想法
        var createIdeaResp = mockMvc.perform(post("/api/projects/" + projectId + "/ideas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"想法 A\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed").value(false))
                .andExpect(jsonPath("$.data.completedAt").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        long ideaId = objectMapper.readTree(createIdeaResp).path("data").path("id").asLong();

        // 3) 标记完成
        mockMvc.perform(put("/api/ideas/" + ideaId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"completed\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed").value(true))
                .andExpect(jsonPath("$.data.completedAt").isNotEmpty());

        // 4) 取消完成
        mockMvc.perform(put("/api/ideas/" + ideaId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"completed\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed").value(false))
                .andExpect(jsonPath("$.data.completedAt").doesNotExist());

        // 5) ?completed=false 过滤生效
        mockMvc.perform(get("/api/projects/" + projectId + "/ideas?completed=false")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1));

        // 6) 删除
        mockMvc.perform(delete("/api/ideas/" + ideaId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 7) 删后再删 → 404
        mockMvc.perform(delete("/api/ideas/" + ideaId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ResultCode.RESOURCE_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("@Valid 校验:content 空白 → 400001")
    void contentBlankRejected() throws Exception {
        // 先建项目
        var resp = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + devUserToken())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"pj-for-blank\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long projectId = objectMapper.readTree(resp).path("data").path("id").asLong();

        mockMvc.perform(post("/api/projects/" + projectId + "/ideas")
                        .header("Authorization", "Bearer " + devUserToken())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ResultCode.PARAM_INVALID.getCode()));
    }

    @Test
    @DisplayName("批量 reorder 想法成功")
    void reorderIdeas() throws Exception {
        String token = devUserToken();
        // 建项目
        var resp = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"reorder-pj\"}"))
                .andReturn().getResponse().getContentAsString();
        long projectId = objectMapper.readTree(resp).path("data").path("id").asLong();

        // 建 3 个想法
        long[] ids = new long[3];
        for (int i = 0; i < 3; i++) {
            var r = mockMvc.perform(post("/api/projects/" + projectId + "/ideas")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"i" + i + "\"}"))
                    .andReturn().getResponse().getContentAsString();
            ids[i] = objectMapper.readTree(r).path("data").path("id").asLong();
        }

        // reorder 倒序 [ids[2], ids[1], ids[0]]
        String reorderBody = "{\"ids\":[" + ids[2] + "," + ids[1] + "," + ids[0] + "]}";
        mockMvc.perform(put("/api/projects/" + projectId + "/ideas/reorder")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(reorderBody))
                .andExpect(status().isOk());

        // 查列表,顺序应该是 ids[2], ids[1], ids[0]
        var listResp = mockMvc.perform(get("/api/projects/" + projectId + "/ideas")
                        .header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString();
        var records = objectMapper.readTree(listResp).path("data").path("records");
        org.assertj.core.api.Assertions.assertThat(records.get(0).path("id").asLong()).isEqualTo(ids[2]);
        org.assertj.core.api.Assertions.assertThat(records.get(2).path("id").asLong()).isEqualTo(ids[0]);
    }
}
