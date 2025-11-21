package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "event_table")
public class EventEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eno;

    @ManyToOne
    @JoinColumn(name = "umno")
    private UserMedicineEntity userMedicine;

    @ManyToOne
    @JoinColumn(name = "atno")
    private AlarmTimeEntity alarmTime;

    @ManyToOne
    @JoinColumn(name = "enno")
    private EventNameEntity eventName;

    @ManyToOne
    @JoinColumn(name = "dno")
    private DescriptionEntity description;

    @ManyToOne
    @JoinColumn(name = "qno")
    private QuizEntity quiz;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;
}
