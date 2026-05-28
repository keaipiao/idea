package com.ideabox.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ideabox.api.common.ResultCode;
import com.ideabox.api.user.entity.User;
import com.ideabox.api.user.mapper.UserMapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

@org.springframework.transaction.annotation.Transactional
class ProjectIntegrationTest extends IntegrationTestBase {

    @Autowired
    private UserMapper userMapper;

    @Test
    @DisplayName("金路径:创建 → 查列表 → 改名 → 删除")
    void projectCrudGoldenPath() throws Exception {
        String token = devUserToken();

        // 创建
        String createBody = "{\"name\":\"测试项目-CRUD\"}";
        String createResp = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(createBody.getBytes(StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.name").value("测试项目-CRUD"))
                .andExpect(jsonPath("$.data.createdAt").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        long projectId = objectMapper.readTree(createResp).path("data").path("id").asLong();

        // 列表
        mockMvc.perform(get("/api/projects").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

        // 改名
        mockMvc.perform(put("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"改后名\"}".getBytes(StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("改后名"));

        // 删除
        mockMvc.perform(delete("/api/projects/" + projectId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 删后查不到
        mockMvc.perform(delete("/api/projects/" + projectId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ResultCode.RESOURCE_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("NEG5: DELETE 不存在的 id → 404001")
    void deleteNonExistent() throws Exception {
        mockMvc.perform(delete("/api/projects/999999")
                        .header("Authorization", "Bearer " + devUserToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ResultCode.RESOURCE_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("NEG6: 跨用户访问别人的项目 → 403001")
    void crossUserAccessForbidden() throws Exception {
        // 创建项目作为 dev 用户(id=1)
        String createResp = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + devUserToken())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"my\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long projectId = objectMapper.readTree(createResp).path("data").path("id").asLong();

        // 另一个真实用户 id=2(由 db insert 创建,确保 user 存在)
        User u2 = new User();
        u2.setNickname("用户2");
        userMapper.insert(u2);

        // 用 user 2 的 token 访问 user 1 的项目 → 403
        mockMvc.perform(delete("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + otherUserToken(u2.getId())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ResultCode.FORBIDDEN_OWNER.getCode()));
    }

    @Test
    @DisplayName("@Valid 校验:name 空白 → 400001")
    void nameBlankRejected() throws Exception {
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + devUserToken())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ResultCode.PARAM_INVALID.getCode()));
    }

    @Test
    @DisplayName("@Valid 校验:name 超 100 字符 → 400001")
    void nameTooLongRejected() throws Exception {
        String longName = "a".repeat(101);
        String body = objectMapper.writeValueAsString(java.util.Map.of("name", longName));
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + devUserToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ResultCode.PARAM_INVALID.getCode()));
    }

    @Test
    @DisplayName("分页参数 ?page=0 ?size=10000 被 normalize")
    void pageParamsNormalized() throws Exception {
        mockMvc.perform(get("/api/projects?page=0&size=10000")
                        .header("Authorization", "Bearer " + devUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.size").value(org.hamcrest.Matchers.lessThanOrEqualTo(200)));
    }
}
