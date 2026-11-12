package gg.overlab.backend.collector.imports;

public record ImportCounts(int created, int updated, int removed) {

    public ImportCounts(int created, int updated) {
        this(created, updated, 0);
    }
}
