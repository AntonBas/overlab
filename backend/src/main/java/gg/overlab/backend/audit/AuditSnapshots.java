package gg.overlab.backend.audit;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.RecordComponent;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public final class AuditSnapshots {

    private AuditSnapshots() {
    }

    public static Map<String, Object> of(Record record) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        for (RecordComponent component : record.getClass().getRecordComponents()) {
            snapshot.put(component.getName(), normalize(read(record, component)));
        }
        return snapshot;
    }

    public static Map<String, Object> diff(Map<String, Object> before, Map<String, Object> after) {
        Map<String, Object> changes = new LinkedHashMap<>();
        after.forEach((field, newValue) -> {
            Object oldValue = before.get(field);
            if (!Objects.equals(oldValue, newValue)) {
                Map<String, Object> change = new LinkedHashMap<>();
                change.put("from", oldValue);
                change.put("to", newValue);
                changes.put(field, change);
            }
        });
        return changes;
    }

    private static Object read(Record record, RecordComponent component) {
        try {
            return component.getAccessor().invoke(record);
        } catch (IllegalAccessException | InvocationTargetException exception) {
            throw new IllegalStateException("Cannot read " + component.getName(), exception);
        }
    }

    private static Object normalize(Object value) {
        if (value == null || value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }
        return value.toString();
    }
}
