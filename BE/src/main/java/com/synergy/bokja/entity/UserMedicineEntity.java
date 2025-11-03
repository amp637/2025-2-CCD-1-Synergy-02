package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_medicine_table")
public class UserMedicineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long umno;

    @ManyToOne
    @JoinColumn(name = "uno")
    private UserEntity user;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false)
    private Timestamp created_at;

    @Column(nullable = false, length = 40)
    private String hospital;

    @ManyToOne
    @JoinColumn(name = "acno")
    private AlarmCombEntity alarmComb;

    @Column(nullable = false)
    private int taken;
}
