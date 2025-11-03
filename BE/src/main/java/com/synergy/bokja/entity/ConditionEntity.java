package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "condition_table")
public class ConditionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cdno;

    @Column(nullable = false)
    private LocalDateTime time;

    @ManyToOne
    @JoinColumn(name = "uno", nullable = false)
    private UserEntity user;

    @ManyToOne
    @JoinColumn(name = "efno", nullable = false)
    private EffectEntity effect;
}
