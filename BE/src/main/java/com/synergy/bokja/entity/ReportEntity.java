package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "report_table")

public class ReportEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rno;

    @ManyToOne
    @JoinColumn(name = "umno")
    private UserMedicineEntity userMedicine;

    @ManyToOne
    @JoinColumn(name = "cdno")
    private ConditionEntity condition;

    @ManyToOne
    @JoinColumn(name = "cyno")
    private CycleEntity cycle;

    @ManyToOne
    @JoinColumn(name = "umino")
    private UserMedicineItemEntity userMedicineItem;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
}
