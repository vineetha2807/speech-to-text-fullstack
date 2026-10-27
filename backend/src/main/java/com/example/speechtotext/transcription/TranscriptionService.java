package com.example.speechtotext.transcription;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class TranscriptionService {
    private final TranscriptionRepository repository;

    public TranscriptionService(TranscriptionRepository repository) {
        this.repository = repository;
    }

    public List<Transcription> list(String search) {
        return (search == null || search.isBlank())
                ? repository.findAllByOrderByCreatedAtDesc()
                : repository.search(search.trim());
    }

    public Transcription get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transcription not found"));
    }

    public Transcription create(TranscriptionRequest request) {
        return repository.save(new Transcription(
                request.title().trim(), request.content().trim(), request.language().trim()));
    }

    public Transcription update(Long id, TranscriptionRequest request) {
        Transcription item = get(id);
        item.setTitle(request.title().trim());
        item.setContent(request.content().trim());
        item.setLanguage(request.language().trim());
        return repository.save(item);
    }

    public void delete(Long id) {
        Transcription item = get(id);
        repository.delete(item);
    }
}
