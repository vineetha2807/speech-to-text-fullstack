package com.example.speechtotext.transcription;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TranscriptionRequest(
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(max = 20000) String content,
        @NotBlank @Size(max = 20) String language
) {}
