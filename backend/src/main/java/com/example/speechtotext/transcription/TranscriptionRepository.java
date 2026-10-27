package com.example.speechtotext.transcription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TranscriptionRepository extends JpaRepository<Transcription, Long> {
    List<Transcription> findAllByOrderByCreatedAtDesc();
    @Query("""
        select t from Transcription t
        where lower(t.title) like lower(concat('%', :search, '%'))
           or lower(t.content) like lower(concat('%', :search, '%'))
        order by t.createdAt desc
        """)
    List<Transcription> search(@Param("search") String search);
}
