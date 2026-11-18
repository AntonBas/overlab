package gg.overlab.backend.audit;

import gg.overlab.backend.audit.dto.AuditLogDto;
import gg.overlab.backend.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Audit log (admin)")
@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
public class AuditAdminController {

    private final AuditQueryService queryService;

    @Operation(summary = "Search the audit log")
    @GetMapping
    public PageResponse<AuditLogDto> search(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return queryService.search(entityType, actorId, action, from, to, page, size);
    }
}
