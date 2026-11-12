package gg.overlab.backend.collector.dto;

public record CollectorJobDto(String name, String cron, boolean enabled, String after, String minInterval) {
}
