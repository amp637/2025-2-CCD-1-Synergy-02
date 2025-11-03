package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "description_table")
public class DescriptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dno;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @ManyToOne
    @JoinColumn(name = "umno")
    private UserMedicineEntity userMedicine;

    @Column(nullable = false)
    private LocalDateTime created_at;

    @Column
    private LocalDateTime updated_at;

    @ManyToOne
    @JoinColumn(name = "enno")
    private EventNameEntity eventName;
}
