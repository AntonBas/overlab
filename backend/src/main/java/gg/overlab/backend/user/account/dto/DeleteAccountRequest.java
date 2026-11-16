package gg.overlab.backend.user.account.dto;

import jakarta.validation.constraints.Size;

public record DeleteAccountRequest(@Size(max = 256) String password, @Size(max = 128) String deletionToken) {
}
