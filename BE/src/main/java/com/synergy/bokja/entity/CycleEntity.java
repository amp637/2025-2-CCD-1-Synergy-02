package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "cycle_table")
public class CycleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cyno;

    @ManyToOne
    @JoinColumn(name = "umno")
    private UserMedicineEntity userMedicine;

    @Column(nullable = false, name = "total_cycle")
    private int totalCycle;

    @Column(name = "cur_cycle")
    private Integer curCycle;

    @Column(name = "save_cycle")
    private Integer saveCycle;

    @Column(nullable = false, name = "start_date")
    private LocalDate startDate;

    @Column(nullable = false, name = "end_date")
    private LocalDate endDate;
}